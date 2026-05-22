"""Skill model and user_skills association."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Skill(db.Model):
    __tablename__ = "skills"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(50))
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user_skills = db.relationship("UserSkill", back_populates="skill")

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "category": self.category,
        }


class UserSkill(db.Model):
    __tablename__ = "user_skills"

    user_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    skill_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True
    )
    skill_type = db.Column(
        db.Enum("teach", "learn", name="skill_type_enum"), primary_key=True
    )
    level = db.Column(
        db.Enum("beginner", "intermediate", "advanced", name="skill_level_enum"),
        default="beginner",
    )

    # Relationships
    user = db.relationship("User", back_populates="skills")
    skill = db.relationship("Skill", back_populates="user_skills")

    def to_dict(self):
        return {
            "skill_id": str(self.skill_id),
            "skill_name": self.skill.name if self.skill else None,
            "skill_type": self.skill_type,
            "level": self.level,
            "category": self.skill.category if self.skill else None,
        }
