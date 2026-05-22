"""Post routes — feed, create, delete, like, report, comments."""

import uuid
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models.post import Post
from app.models.comment import Comment
from app.models.like import Like
from app.utils.helpers import (
    success_response, error_response, paginate, get_current_user, create_notification,
)

posts_bp = Blueprint("posts", __name__, url_prefix="/api/v1/posts")


@posts_bp.route("/", methods=["GET"])
@jwt_required()
def list_posts():
    user = get_current_user()
    query = (
        db.select(Post)
        .filter_by(is_deleted=False)
        .order_by(Post.created_at.desc())
    )
    uid = user.id if user else None
    items, pagination = paginate(query, lambda p: p.to_dict(current_user_id=uid))
    return success_response(items, pagination=pagination)


@posts_bp.route("/", methods=["POST"])
@jwt_required()
def create_post():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)
    if user.is_banned:
        return error_response("Your account has been suspended.", "BANNED", 403)

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return error_response("Post content is required.", "VALIDATION_ERROR", 400)

    post = Post(author_id=user.id, content=content)
    db.session.add(post)
    db.session.commit()
    return success_response(post.to_dict(current_user_id=user.id), 201)


@posts_bp.route("/<post_id>", methods=["GET"])
@jwt_required()
def get_post(post_id):
    user = get_current_user()
    try:
        pid = uuid.UUID(post_id)
    except ValueError:
        return error_response("Invalid post ID.", "VALIDATION_ERROR", 400)

    post = db.session.get(Post, pid)
    if not post or post.is_deleted:
        return error_response("Post not found.", "NOT_FOUND", 404)

    uid = user.id if user else None
    post_data = post.to_dict(current_user_id=uid)
    comments = [
        c.to_dict() for c in post.comments
        if not c.is_deleted
    ]
    post_data["comments"] = comments
    return success_response(post_data)


@posts_bp.route("/<post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    user = get_current_user()
    try:
        pid = uuid.UUID(post_id)
    except ValueError:
        return error_response("Invalid post ID.", "VALIDATION_ERROR", 400)

    post = db.session.get(Post, pid)
    if not post:
        return error_response("Post not found.", "NOT_FOUND", 404)
    if post.author_id != user.id and not user.is_admin:
        return error_response("Access denied.", "FORBIDDEN", 403)

    post.is_deleted = True
    db.session.commit()
    return success_response({"message": "Post deleted."})


@posts_bp.route("/<post_id>/like", methods=["POST"])
@jwt_required()
def toggle_like(post_id):
    user = get_current_user()
    try:
        pid = uuid.UUID(post_id)
    except ValueError:
        return error_response("Invalid post ID.", "VALIDATION_ERROR", 400)

    post = db.session.get(Post, pid)
    if not post or post.is_deleted:
        return error_response("Post not found.", "NOT_FOUND", 404)

    existing = Like.query.filter_by(user_id=user.id, post_id=pid).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return success_response({"liked": False, "likes_count": post.likes_count})

    like = Like(user_id=user.id, post_id=pid)
    db.session.add(like)
    db.session.commit()

    # Notify post author (don't notify yourself)
    if post.author_id != user.id:
        create_notification(
            post.author_id, "post_like",
            f"{user.name} liked your post",
            post.id,
        )

    return success_response({"liked": True, "likes_count": post.likes_count})


@posts_bp.route("/<post_id>/report", methods=["POST"])
@jwt_required()
def report_post(post_id):
    try:
        pid = uuid.UUID(post_id)
    except ValueError:
        return error_response("Invalid post ID.", "VALIDATION_ERROR", 400)

    post = db.session.get(Post, pid)
    if not post or post.is_deleted:
        return error_response("Post not found.", "NOT_FOUND", 404)

    post.is_reported = True
    db.session.commit()
    return success_response({"message": "Post reported."})


@posts_bp.route("/<post_id>/comments", methods=["GET"])
@jwt_required()
def list_comments(post_id):
    try:
        pid = uuid.UUID(post_id)
    except ValueError:
        return error_response("Invalid post ID.", "VALIDATION_ERROR", 400)

    post = db.session.get(Post, pid)
    if not post or post.is_deleted:
        return error_response("Post not found.", "NOT_FOUND", 404)

    comments = (
        Comment.query
        .filter_by(post_id=pid, is_deleted=False)
        .order_by(Comment.created_at.asc())
        .all()
    )
    return success_response([c.to_dict() for c in comments])


@posts_bp.route("/<post_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(post_id):
    user = get_current_user()
    try:
        pid = uuid.UUID(post_id)
    except ValueError:
        return error_response("Invalid post ID.", "VALIDATION_ERROR", 400)

    post = db.session.get(Post, pid)
    if not post or post.is_deleted:
        return error_response("Post not found.", "NOT_FOUND", 404)

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return error_response("Comment content is required.", "VALIDATION_ERROR", 400)

    comment = Comment(post_id=pid, author_id=user.id, content=content)
    db.session.add(comment)
    db.session.commit()

    if post.author_id != user.id:
        create_notification(
            post.author_id, "post_comment",
            f"{user.name} commented on your post",
            post.id,
        )

    return success_response(comment.to_dict(), 201)


@posts_bp.route("/<post_id>/comments/<comment_id>", methods=["DELETE"])
@jwt_required()
def delete_comment(post_id, comment_id):
    user = get_current_user()
    try:
        cid = uuid.UUID(comment_id)
    except ValueError:
        return error_response("Invalid comment ID.", "VALIDATION_ERROR", 400)

    comment = db.session.get(Comment, cid)
    if not comment or comment.is_deleted:
        return error_response("Comment not found.", "NOT_FOUND", 404)
    if comment.author_id != user.id and not user.is_admin:
        return error_response("Access denied.", "FORBIDDEN", 403)

    comment.is_deleted = True
    db.session.commit()
    return success_response({"message": "Comment deleted."})
