"""Match routes — CRUD, accept/reject/complete, suggestions."""

import uuid
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import or_, and_

from app.extensions import db
from app.models.match import Match
from app.models.skill import Skill, UserSkill
from app.models.user import User
from app.utils.helpers import (
    success_response, error_response, paginate, get_current_user, create_notification,
)

matches_bp = Blueprint("matches", __name__, url_prefix="/api/v1/matches")


@matches_bp.route("/", methods=["GET"])
@jwt_required()
def list_matches():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    status = request.args.get("status")
    query = db.select(Match).filter(
        or_(Match.requester_id == user.id, Match.receiver_id == user.id)
    ).order_by(Match.created_at.desc())

    if status:
        query = query.filter(Match.status == status)

    items, pagination = paginate(query, lambda m: m.to_dict())
    return success_response(items, pagination=pagination)


@matches_bp.route("/open", methods=["GET"])
@jwt_required()
def list_open_requests():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    teach_skill_id = request.args.get("teach")
    learn_skill_id = request.args.get("learn")

    query = (
        db.select(Match)
        .filter(Match.receiver_id == None, Match.status == "pending", Match.requester_id != user.id)
    )

    if teach_skill_id:
        # Compatible if the other person wants to learn what I teach
        query = query.filter(Match.learn_skill_id == teach_skill_id)
    if learn_skill_id:
        # Compatible if the other person teaches what I want to learn
        query = query.filter(Match.teach_skill_id == learn_skill_id)

    query = query.order_by(Match.created_at.desc())
    items, pagination = paginate(query, lambda m: m.to_dict())
    return success_response(items, pagination=pagination)


@matches_bp.route("/", methods=["POST"])
@jwt_required()
def create_match():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    data = request.get_json(silent=True) or {}
    receiver_id_str = data.get("receiver_id")
    receiver_id = None
    try:
        if receiver_id_str:
            receiver_id = uuid.UUID(receiver_id_str)
        teach_skill_id = uuid.UUID(data.get("teach_skill_id", ""))
        learn_skill_id = uuid.UUID(data.get("learn_skill_id", ""))
    except (ValueError, AttributeError):
        return error_response("Valid teach_skill_id and learn_skill_id are required.", "VALIDATION_ERROR", 400)

    if receiver_id == user.id:
        return error_response("Cannot create a match with yourself.", "VALIDATION_ERROR", 400)

    if receiver_id:
        receiver = db.session.get(User, receiver_id)
        if not receiver:
            return error_response("Receiver user not found.", "NOT_FOUND", 404)

        existing = Match.query.filter_by(
            requester_id=user.id, receiver_id=receiver_id,
            teach_skill_id=teach_skill_id, learn_skill_id=learn_skill_id,
        ).first()
        if existing:
            return error_response("Match request already exists.", "DUPLICATE", 409)
        score = _calculate_match_score(user.id, receiver_id)
    else:
        # Check for existing open request
        existing = Match.query.filter_by(
            requester_id=user.id, receiver_id=None,
            teach_skill_id=teach_skill_id, learn_skill_id=learn_skill_id,
        ).first()
        if existing:
            return error_response("You already have an open request for this skill pair.", "DUPLICATE", 409)
        score = 0

    match = Match(
        requester_id=user.id, receiver_id=receiver_id,
        teach_skill_id=teach_skill_id, learn_skill_id=learn_skill_id,
        match_score=score,
    )
    db.session.add(match)
    db.session.commit()

    if receiver_id:
        create_notification(
            receiver_id, "match_request",
            f"{user.name} wants to do a skill swap with you!",
            match.id,
        )

    return success_response(match.to_dict(), 201)


@matches_bp.route("/<match_id>", methods=["GET"])
@jwt_required()
def get_match(match_id):
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
    return success_response(match.to_dict())


@matches_bp.route("/<match_id>/accept", methods=["PUT"])
@jwt_required()
def accept_match(match_id):
    user = get_current_user()
    try:
        mid = uuid.UUID(match_id)
    except ValueError:
        return error_response("Invalid match ID.", "VALIDATION_ERROR", 400)

    match = db.session.get(Match, mid)
    if not match:
        return error_response("Match not found.", "NOT_FOUND", 404)
    if match.receiver_id is not None and match.receiver_id != user.id:
        return error_response("Only the receiver can accept.", "FORBIDDEN", 403)
    if match.requester_id == user.id:
        return error_response("You cannot accept your own open request.", "FORBIDDEN", 403)
    if match.status != "pending":
        return error_response(f"Cannot accept a match with status '{match.status}'.", "VALIDATION_ERROR", 400)

    # If it was an open request, this user is now the receiver
    if match.receiver_id is None:
        match.receiver_id = user.id

    match.status = "accepted"
    db.session.commit()

    create_notification(
        match.requester_id, "match_accepted",
        f"{user.name} accepted your skill swap request!",
        match.id,
    )
    return success_response(match.to_dict())


@matches_bp.route("/<match_id>/reject", methods=["PUT"])
@jwt_required()
def reject_match(match_id):
    user = get_current_user()
    try:
        mid = uuid.UUID(match_id)
    except ValueError:
        return error_response("Invalid match ID.", "VALIDATION_ERROR", 400)

    match = db.session.get(Match, mid)
    if not match:
        return error_response("Match not found.", "NOT_FOUND", 404)
    if match.receiver_id != user.id:
        return error_response("Only the receiver can reject.", "FORBIDDEN", 403)
    if match.status != "pending":
        return error_response(f"Cannot reject a match with status '{match.status}'.", "VALIDATION_ERROR", 400)

    match.status = "rejected"
    db.session.commit()
    return success_response(match.to_dict())


@matches_bp.route("/<match_id>", methods=["DELETE"])
@jwt_required()
def cancel_match(match_id):
    user = get_current_user()
    try:
        mid = uuid.UUID(match_id)
    except ValueError:
        return error_response("Invalid match ID.", "VALIDATION_ERROR", 400)

    match = db.session.get(Match, mid)
    if not match:
        return error_response("Match not found.", "NOT_FOUND", 404)
    if match.requester_id != user.id:
        return error_response("Only the requester can cancel this match.", "FORBIDDEN", 403)
    if match.status != "pending":
        return error_response("Only pending matches can be cancelled.", "VALIDATION_ERROR", 400)

    db.session.delete(match)
    db.session.commit()
    return success_response({"message": "Match cancelled."})


@matches_bp.route("/<match_id>/complete", methods=["PUT"])
@jwt_required()
def complete_match(match_id):
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
        return error_response("Only accepted matches can be completed.", "VALIDATION_ERROR", 400)

    match.status = "completed"
    db.session.commit()
    return success_response(match.to_dict())


@matches_bp.route("/suggestions", methods=["GET"])
@jwt_required()
def match_suggestions():
    user = get_current_user()
    if not user:
        return error_response("User not found.", "NOT_FOUND", 404)

    # Get current user's teach and learn skill IDs
    my_teach_ids = {us.skill_id for us in user.skills if us.skill_type == "teach"}
    my_learn_ids = {us.skill_id for us in user.skills if us.skill_type == "learn"}

    if not my_teach_ids and not my_learn_ids:
        return success_response([])

    # Find users who learn what I teach OR teach what I learn
    candidates = (
        db.session.query(User)
        .join(UserSkill, User.id == UserSkill.user_id)
        .filter(User.id != user.id, User.is_banned == False)
        .filter(
            or_(
                and_(UserSkill.skill_type == "learn", UserSkill.skill_id.in_(my_teach_ids)),
                and_(UserSkill.skill_type == "teach", UserSkill.skill_id.in_(my_learn_ids)),
            )
        )
        .distinct()
        .all()
    )

    # Score each candidate
    scored = []
    for candidate in candidates:
        c_teach = {us.skill_id for us in candidate.skills if us.skill_type == "teach"}
        c_learn = {us.skill_id for us in candidate.skills if us.skill_type == "learn"}

        # I teach what they learn + they teach what I learn
        overlap_a = len(my_teach_ids & c_learn)
        overlap_b = len(my_learn_ids & c_teach)
        total_possible = max(len(my_teach_ids) + len(my_learn_ids), 1)
        score = int(((overlap_a + overlap_b) / total_possible) * 100)
        score = min(score, 100)

        scored.append({
            **candidate.to_dict(),
            "match_score": score,
            "overlap_teach": overlap_a,
            "overlap_learn": overlap_b,
        })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return success_response(scored[:10])


def _calculate_match_score(user_id, other_id):
    """Simple overlap score between two users."""
    user_skills = UserSkill.query.filter_by(user_id=user_id).all()
    other_skills = UserSkill.query.filter_by(user_id=other_id).all()

    my_teach = {us.skill_id for us in user_skills if us.skill_type == "teach"}
    my_learn = {us.skill_id for us in user_skills if us.skill_type == "learn"}
    o_teach = {us.skill_id for us in other_skills if us.skill_type == "teach"}
    o_learn = {us.skill_id for us in other_skills if us.skill_type == "learn"}

    overlap = len(my_teach & o_learn) + len(my_learn & o_teach)
    total = max(len(my_teach) + len(my_learn), 1)
    return min(int((overlap / total) * 100), 100)
