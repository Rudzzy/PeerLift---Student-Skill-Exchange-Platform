"""Shared utility functions — pagination, error responses, decorators."""

import uuid
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db


def success_response(data=None, status_code=200, pagination=None):
    """Standard success JSON envelope."""
    body = {"success": True, "data": data}
    if pagination:
        body["pagination"] = pagination
    return jsonify(body), status_code


def error_response(message, code="ERROR", status_code=400):
    """Standard error JSON envelope."""
    return jsonify({"success": False, "error": message, "code": code}), status_code


def paginate(query, schema_fn=None):
    """Apply pagination to a SQLAlchemy query and return (items, pagination_dict).

    Reads ``page`` and ``per_page`` from query string (defaults 1 / 20).
    ``schema_fn`` is an optional callable that converts each row to a dict.
    """
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)

    paginated = db.paginate(query, page=page, per_page=per_page, error_out=False)

    items = paginated.items
    if schema_fn:
        items = [schema_fn(item) for item in items]

    pagination_dict = {
        "page": paginated.page,
        "per_page": paginated.per_page,
        "total": paginated.total,
        "pages": paginated.pages,
    }
    return items, pagination_dict


def admin_required(fn):
    """Decorator that rejects non-admin users with 403."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        from app.models.user import User

        user_id = get_jwt_identity()
        user = db.session.get(User, uuid.UUID(user_id))
        if not user or not user.is_admin:
            return error_response("Admin access required.", "FORBIDDEN", 403)
        if user.is_banned:
            return error_response("Your account has been suspended.", "BANNED", 403)
        return fn(*args, **kwargs)
    return wrapper


def get_current_user():
    """Fetch the full User object for the current JWT identity."""
    from app.models.user import User

    user_id = get_jwt_identity()
    user = db.session.get(User, uuid.UUID(user_id))
    return user


def create_notification(user_id, notif_type, message, related_id=None):
    """Create and persist a notification record."""
    from app.models.notification import Notification

    notif = Notification(
        user_id=user_id,
        type=notif_type,
        message=message,
        related_id=related_id,
    )
    db.session.add(notif)
    db.session.commit()
    return notif
