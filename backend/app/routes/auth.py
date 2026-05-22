"""Auth routes — register, login, logout, me."""

import re
import uuid
from flask import Blueprint, request, current_app
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, get_jwt,
)
from app.extensions import db
from app.models.user import User
from app.utils.helpers import success_response, error_response, get_current_user

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

EMAIL_RE = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,30}$")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    errors = []

    name = (data.get("name") or "").strip()
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    college = (data.get("college") or "").strip()

    if not name:
        errors.append("Name is required.")
    if not username or not USERNAME_RE.match(username):
        errors.append("Username must be 3-30 alphanumeric characters or underscores.")
    if not email or not EMAIL_RE.match(email):
        errors.append("Valid email is required.")
    if len(password) < 8:
        errors.append("Password must be at least 8 characters.")

    if errors:
        return error_response("; ".join(errors), "VALIDATION_ERROR", 400)

    if User.query.filter_by(email=email).first():
        return error_response("Email already registered.", "DUPLICATE", 409)
    if User.query.filter_by(username=username).first():
        return error_response("Username already taken.", "DUPLICATE", 409)

    user = User(name=name, username=username, email=email, college=college or None)
    user.set_password(password)
    user.calculate_profile_completion()

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return success_response({
        "user": user.to_dict(include_email=True),
        "access_token": token,
    }, 201)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return error_response("Email and password are required.", "VALIDATION_ERROR", 400)

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return error_response("Invalid email or password.", "AUTH_FAILED", 401)

    if user.is_banned:
        return error_response("Your account has been suspended.", "BANNED", 403)

    token = create_access_token(identity=str(user.id))
    return success_response({
        "user": user.to_dict(include_email=True),
        "access_token": token,
    })


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    current_app.config["JWT_BLOCKLIST"].add(jti)
    return success_response({"message": "Logged out successfully."})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)
    if user.is_banned:
        return error_response("Your account has been suspended.", "BANNED", 403)
    return success_response(user.to_dict(include_email=True))
