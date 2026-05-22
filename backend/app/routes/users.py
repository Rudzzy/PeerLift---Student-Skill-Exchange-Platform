"""User routes — list, profile, update, skills, stats."""

import uuid
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import or_, func, select

from app.extensions import db
from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.models.match import Match
from app.models.post import Post
from app.utils.helpers import (
    success_response, error_response, paginate, get_current_user,
)

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")


@users_bp.route("/", methods=["GET"])
@jwt_required()
def list_users():
    search = request.args.get("search", "").strip()
    query = db.select(User).filter_by(is_banned=False).order_by(User.created_at.desc())
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(User.name.ilike(pattern), User.username.ilike(pattern), User.college.ilike(pattern))
        )
    items, pagination = paginate(query, lambda u: u.to_dict())
    return success_response(items, pagination=pagination)


@users_bp.route("/<user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        return error_response("Invalid user ID.", "VALIDATION_ERROR", 400)
    user = db.session.get(User, uid)
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)
    return success_response(user.to_dict())


@users_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_profile():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)
    if user.is_banned:
        return error_response("Your account has been suspended.", "BANNED", 403)

    data = request.get_json(silent=True) or {}
    updatable = [
        "name", "college", "degree", "branch", "current_year",
        "bio", "github_url", "linkedin_url", "portfolio_url", "avatar_url",
    ]
    for field in updatable:
        if field in data:
            val = data[field]
            if field == "current_year" and val is not None:
                val = int(val)
            setattr(user, field, val)

    user.calculate_profile_completion()
    db.session.commit()
    return success_response(user.to_dict(include_email=True))


@users_bp.route("/me", methods=["DELETE"])
@jwt_required()
def delete_account():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)
    db.session.delete(user)
    db.session.commit()
    return success_response({"message": "Account deleted."})


@users_bp.route("/me/stats", methods=["GET"])
@jwt_required()
def my_stats():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    total_matches = Match.query.filter(
        or_(Match.requester_id == user.id, Match.receiver_id == user.id)
    ).count()
    pending = Match.query.filter(
        Match.receiver_id == user.id, Match.status == "pending"
    ).count()
    posts_count = Post.query.filter_by(author_id=user.id, is_deleted=False).count()
    teaching = UserSkill.query.filter_by(user_id=user.id, skill_type="teach").count()
    learning = UserSkill.query.filter_by(user_id=user.id, skill_type="learn").count()

    # Determine most popular skill among user's teaches
    popular_skill = None
    teach_skills = UserSkill.query.filter_by(user_id=user.id, skill_type="teach").all()
    if teach_skills:
        popular_skill = teach_skills[0].skill.name if teach_skills[0].skill else None

    return success_response({
        "total_matches": total_matches,
        "pending_requests": pending,
        "profile_completion": user.profile_completion,
        "posts_count": posts_count,
        "skills_teaching": teaching,
        "skills_learning": learning,
        "popular_skill": popular_skill,
    })


@users_bp.route("/me/skills", methods=["POST"])
@jwt_required()
def add_skill():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    data = request.get_json(silent=True) or {}
    skill_id = data.get("skill_id")
    skill_type = data.get("skill_type")  # 'teach' or 'learn'
    level = data.get("level", "beginner")

    if not skill_id or skill_type not in ("teach", "learn"):
        return error_response("skill_id and skill_type ('teach'/'learn') are required.", "VALIDATION_ERROR", 400)
    if level not in ("beginner", "intermediate", "advanced"):
        return error_response("level must be beginner, intermediate, or advanced.", "VALIDATION_ERROR", 400)

    try:
        sid = uuid.UUID(skill_id)
    except ValueError:
        return error_response("Invalid skill ID.", "VALIDATION_ERROR", 400)

    skill = db.session.get(Skill, sid)
    if not skill:
        return error_response("Skill not found.", "NOT_FOUND", 404)

    existing = UserSkill.query.filter_by(user_id=user.id, skill_id=sid, skill_type=skill_type).first()
    if existing:
        return error_response("Skill already added.", "DUPLICATE", 409)

    us = UserSkill(user_id=user.id, skill_id=sid, skill_type=skill_type, level=level)
    db.session.add(us)
    db.session.commit()
    return success_response(us.to_dict(), 201)


@users_bp.route("/me/skills/<skill_id>", methods=["DELETE"])
@jwt_required()
def remove_skill(skill_id):
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)
    try:
        sid = uuid.UUID(skill_id)
    except ValueError:
        return error_response("Invalid skill ID.", "VALIDATION_ERROR", 400)

    skill_type = request.args.get("type", "teach")
    us = UserSkill.query.filter_by(user_id=user.id, skill_id=sid, skill_type=skill_type).first()
    if not us:
        return error_response("Skill assignment not found.", "NOT_FOUND", 404)
    db.session.delete(us)
    db.session.commit()
    return success_response({"message": "Skill removed."})
