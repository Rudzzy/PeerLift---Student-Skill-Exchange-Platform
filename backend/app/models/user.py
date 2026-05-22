"""User model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    college = db.Column(db.String(150))
    degree = db.Column(db.String(100))
    branch = db.Column(db.String(100))
    current_year = db.Column(db.Integer)
    bio = db.Column(db.Text)
    github_url = db.Column(db.String(255))
    linkedin_url = db.Column(db.String(255))
    portfolio_url = db.Column(db.String(255))
    avatar_url = db.Column(db.String(255))
    is_admin = db.Column(db.Boolean, default=False)
    is_banned = db.Column(db.Boolean, default=False)
    profile_completion = db.Column(db.Integer, default=0)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    skills = db.relationship(
        "UserSkill", back_populates="user", cascade="all, delete-orphan"
    )
    posts = db.relationship("Post", back_populates="author", cascade="all, delete-orphan")
    notifications = db.relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def calculate_profile_completion(self):
        fields = [
            self.name, self.username, self.email, self.college, self.degree,
            self.branch, self.current_year, self.bio, self.github_url,
            self.linkedin_url,
        ]
        filled = sum(1 for f in fields if f)
        self.profile_completion = int((filled / len(fields)) * 100)

    def to_dict(self, include_email=False):
        data = {
            "id": str(self.id),
            "name": self.name,
            "username": self.username,
            "college": self.college,
            "degree": self.degree,
            "branch": self.branch,
            "current_year": self.current_year,
            "bio": self.bio,
            "github_url": self.github_url,
            "linkedin_url": self.linkedin_url,
            "portfolio_url": self.portfolio_url,
            "avatar_url": self.avatar_url,
            "is_admin": self.is_admin,
            "is_banned": self.is_banned,
            "profile_completion": self.profile_completion,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "skills_teaching": [
                us.to_dict() for us in self.skills if us.skill_type == "teach"
            ],
            "skills_learning": [
                us.to_dict() for us in self.skills if us.skill_type == "learn"
            ],
        }
        if include_email:
            data["email"] = self.email
        return data

    def to_mini_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "username": self.username,
            "avatar_url": self.avatar_url,
            "college": self.college,
        }
