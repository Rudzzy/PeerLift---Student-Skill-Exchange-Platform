"""Message routes — conversations, send, mark read."""

import uuid
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import or_, and_

from app.extensions import db
from app.models.match import Match
from app.models.message import Message
from app.utils.helpers import (
    success_response, error_response, get_current_user, create_notification,
)

messages_bp = Blueprint("messages", __name__, url_prefix="/api/v1/messages")


@messages_bp.route("/", methods=["GET"])
@jwt_required()
def list_conversations():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    # Get all accepted matches for this user
    matches = Match.query.filter(
        Match.status == "accepted",
        or_(Match.requester_id == user.id, Match.receiver_id == user.id),
    ).order_by(Match.updated_at.desc()).all()

    conversations = []
    for match in matches:
        other = match.receiver if match.requester_id == user.id else match.requester
        last_msg = (
            Message.query
            .filter_by(match_id=match.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        unread = Message.query.filter(
            Message.match_id == match.id,
            Message.sender_id != user.id,
            Message.is_read == False,
        ).count()

        conversations.append({
            "match_id": str(match.id),
            "other_user": other.to_mini_dict() if other else None,
            "teach_skill": match.teach_skill.to_dict() if match.teach_skill else None,
            "learn_skill": match.learn_skill.to_dict() if match.learn_skill else None,
            "last_message": last_msg.to_dict() if last_msg else None,
            "unread_count": unread,
        })

    return success_response(conversations)


@messages_bp.route("/<match_id>", methods=["GET"])
@jwt_required()
def get_messages(match_id):
    user = get_current_user()
    try:
        mid = uuid.UUID(match_id)
    except ValueError:
        return error_response("Invalid match ID.", "VALIDATION_ERROR", 400)

    match = db.session.get(Match, mid)
    if not match:
        return error_response("Match not found.", "NOT_FOUND", 404)
    if match.requester_id != user.id and match.receiver_id != user.id:
        return error_response("Access denied.", "FORBIDDEN", 403)
    if match.status != "accepted":
        return error_response("Messaging is only available for accepted matches.", "VALIDATION_ERROR", 400)

    messages = (
        Message.query
        .filter_by(match_id=mid)
        .order_by(Message.created_at.asc())
        .all()
    )
    return success_response([m.to_dict() for m in messages])


@messages_bp.route("/<match_id>", methods=["POST"])
@jwt_required()
def send_message(match_id):
    user = get_current_user()
    try:
        mid = uuid.UUID(match_id)
    except ValueError:
        return error_response("Invalid match ID.", "VALIDATION_ERROR", 400)

    match = db.session.get(Match, mid)
    if not match:
        return error_response("Match not found.", "NOT_FOUND", 404)
    if match.requester_id != user.id and match.receiver_id != user.id:
        return error_response("Access denied.", "FORBIDDEN", 403)
    if match.status != "accepted":
        return error_response("Messaging is only available for accepted matches.", "VALIDATION_ERROR", 400)

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return error_response("Message content is required.", "VALIDATION_ERROR", 400)

    msg = Message(match_id=mid, sender_id=user.id, content=content)
    db.session.add(msg)
    db.session.commit()

    # Notify the other party
    recipient_id = match.receiver_id if match.requester_id == user.id else match.requester_id
    create_notification(
        recipient_id, "new_message",
        f"New message from {user.name}",
        match.id,
    )

    return success_response(msg.to_dict(), 201)


@messages_bp.route("/<match_id>/read", methods=["PUT"])
@jwt_required()
def mark_read(match_id):
    user = get_current_user()
    try:
        mid = uuid.UUID(match_id)
    except ValueError:
        return error_response("Invalid match ID.", "VALIDATION_ERROR", 400)

    match = db.session.get(Match, mid)
    if not match:
        return error_response("Match not found.", "NOT_FOUND", 404)
    if match.requester_id != user.id and match.receiver_id != user.id:
        return error_response("Access denied.", "FORBIDDEN", 403)

    # Mark all messages NOT sent by current user as read
    Message.query.filter(
        Message.match_id == mid,
        Message.sender_id != user.id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.session.commit()

    return success_response({"message": "Messages marked as read."})
