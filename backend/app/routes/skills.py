"""Skills routes — list, create, trending."""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app.extensions import db
from app.models.skill import Skill, UserSkill
from app.utils.helpers import success_response, error_response, admin_required

skills_bp = Blueprint("skills", __name__, url_prefix="/api/v1/skills")


@skills_bp.route("/", methods=["GET"])
@jwt_required()
def list_skills():
    skills = Skill.query.order_by(Skill.name).all()
    return success_response([s.to_dict() for s in skills])


@skills_bp.route("/", methods=["POST"])
@jwt_required()
@admin_required
def create_skill():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    category = (data.get("category") or "").strip() or None

    if not name:
        return error_response("Skill name is required.", "VALIDATION_ERROR", 400)

    existing = Skill.query.filter(func.lower(Skill.name) == name.lower()).first()
    if existing:
        return error_response("Skill already exists.", "DUPLICATE", 409)

    skill = Skill(name=name, category=category)
    db.session.add(skill)
    db.session.commit()
    return success_response(skill.to_dict(), 201)


@skills_bp.route("/trending", methods=["GET"])
@jwt_required()
def trending_skills():
    results = (
        db.session.query(Skill, func.count(UserSkill.user_id).label("usage"))
        .join(UserSkill, Skill.id == UserSkill.skill_id)
        .group_by(Skill.id)
        .order_by(func.count(UserSkill.user_id).desc())
        .limit(10)
        .all()
    )
    data = [
        {**skill.to_dict(), "usage_count": usage}
        for skill, usage in results
    ]
    return success_response(data)
