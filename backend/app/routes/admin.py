"""Admin routes — platform stats, user management, post moderation, skill analytics."""

import uuid
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func, or_

from app.extensions import db
from app.models.user import User
from app.models.post import Post
from app.models.match import Match
from app.models.skill import Skill, UserSkill
from app.models.notification import Notification
from app.utils.helpers import (
    success_response, error_response, paginate, admin_required,
)

admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1/admin")


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def platform_stats():
    total_users = User.query.filter_by(is_banned=False).count()
    total_posts = Post.query.filter_by(is_deleted=False).count()
    total_matches = Match.query.count()
    active_requests = Match.query.filter_by(status="pending").count()
    accepted_matches = Match.query.filter_by(status="accepted").count()

    # Active today (users created or updated in last 24h — rough proxy)
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    active_today = User.query.filter(User.updated_at >= yesterday).count()

    match_success = 0
    if total_matches > 0:
        match_success = int((accepted_matches / total_matches) * 100)

    return success_response({
        "total_users": total_users,
        "total_posts": total_posts,
        "total_matches": total_matches,
        "active_requests": active_requests,
        "match_success_rate": match_success,
        "active_today": active_today,
    })


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@admin_required
def list_users():
    search = request.args.get("search", "").strip()
    query = db.select(User).order_by(User.created_at.desc())
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(User.name.ilike(pattern), User.username.ilike(pattern), User.email.ilike(pattern))
        )
    items, pagination = paginate(query, lambda u: u.to_dict(include_email=True))
    return success_response(items, pagination=pagination)


@admin_bp.route("/users/<user_id>/ban", methods=["PUT"])
@jwt_required()
@admin_required
def ban_user(user_id):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        return error_response("Invalid user ID.", "VALIDATION_ERROR", 400)

    user = db.session.get(User, uid)
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)
    if user.is_admin:
        return error_response("Cannot ban an admin.", "FORBIDDEN", 403)

    user.is_banned = True
    db.session.commit()
    return success_response({"message": f"User {user.username} has been banned."})


@admin_bp.route("/users/<user_id>/unban", methods=["PUT"])
@jwt_required()
@admin_required
def unban_user(user_id):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        return error_response("Invalid user ID.", "VALIDATION_ERROR", 400)

    user = db.session.get(User, uid)
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    user.is_banned = False
    db.session.commit()
    return success_response({"message": f"User {user.username} has been unbanned."})


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_user(user_id):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        return error_response("Invalid user ID.", "VALIDATION_ERROR", 400)

    user = db.session.get(User, uid)
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)
    if user.is_admin:
        return error_response("Cannot delete an admin.", "FORBIDDEN", 403)

    db.session.delete(user)
    db.session.commit()
    return success_response({"message": "User deleted."})


@admin_bp.route("/posts/reported", methods=["GET"])
@jwt_required()
@admin_required
def reported_posts():
    query = (
        db.select(Post)
        .filter_by(is_reported=True, is_deleted=False)
        .order_by(Post.created_at.desc())
    )
    items, pagination = paginate(query, lambda p: p.to_dict())
    return success_response(items, pagination=pagination)


@admin_bp.route("/posts/<post_id>/dismiss", methods=["PUT"])
@jwt_required()
@admin_required
def dismiss_report(post_id):
    try:
        pid = uuid.UUID(post_id)
    except ValueError:
        return error_response("Invalid post ID.", "VALIDATION_ERROR", 400)

    post = db.session.get(Post, pid)
    if not post:
        return error_response("Post not found.", "NOT_FOUND", 404)

    post.is_reported = False
    db.session.commit()
    return success_response({"message": "Report dismissed."})


@admin_bp.route("/posts/<post_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_post(post_id):
    try:
        pid = uuid.UUID(post_id)
    except ValueError:
        return error_response("Invalid post ID.", "VALIDATION_ERROR", 400)

    post = db.session.get(Post, pid)
    if not post:
        return error_response("Post not found.", "NOT_FOUND", 404)

    db.session.delete(post)
    db.session.commit()
    return success_response({"message": "Post deleted permanently."})


@admin_bp.route("/skills/popular", methods=["GET"])
@jwt_required()
@admin_required
def popular_skills():
    results = (
        db.session.query(Skill.name, func.count(UserSkill.user_id).label("count"))
        .join(UserSkill, Skill.id == UserSkill.skill_id)
        .group_by(Skill.id, Skill.name)
        .order_by(func.count(UserSkill.user_id).desc())
        .limit(10)
        .all()
    )
    data = [{"name": name, "count": count} for name, count in results]
    return success_response(data)
