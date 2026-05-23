"""Notification routes — list, read, delete, unread count."""

import uuid
from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models.notification import Notification
from app.utils.helpers import success_response, error_response, paginate, get_current_user

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/v1/notifications")


@notifications_bp.route("/", methods=["GET"])
@jwt_required()
def list_notifications():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    query = (
        db.select(Notification)
        .filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
    )
    items, pagination = paginate(query, lambda n: n.to_dict())
    return success_response(items, pagination=pagination)


@notifications_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def unread_count():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return success_response({"unread_count": count})


@notifications_bp.route("/<notif_id>/read", methods=["PUT"])
@jwt_required()
def mark_read(notif_id):
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)
    try:
        nid = uuid.UUID(notif_id)
    except ValueError:
        return error_response("Invalid notification ID.", "VALIDATION_ERROR", 400)

    notif = db.session.get(Notification, nid)
    if not notif or notif.user_id != user.id:
        return error_response("Notification not found.", "NOT_FOUND", 404)

    notif.is_read = True
    db.session.commit()
    return success_response(notif.to_dict())


@notifications_bp.route("/read-all", methods=["PUT"])
@jwt_required()
def mark_all_read():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    Notification.query.filter_by(user_id=user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return success_response({"message": "All notifications marked as read."})


@notifications_bp.route("/<notif_id>", methods=["DELETE"])
@jwt_required()
def delete_notification(notif_id):
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    try:
        nid = uuid.UUID(notif_id)
    except ValueError:
        return error_response("Invalid notification ID.", "VALIDATION_ERROR", 400)

    notif = db.session.get(Notification, nid)
    if not notif or notif.user_id != user.id:
        return error_response("Notification not found.", "NOT_FOUND", 404)

    db.session.delete(notif)
    db.session.commit()
    return success_response({"message": "Notification deleted."})
