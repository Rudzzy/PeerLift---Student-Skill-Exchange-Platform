"""Post model for the community feed."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content = db.Column(db.Text, nullable=False)
    is_reported = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    author = db.relationship("User", back_populates="posts")
    comments = db.relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = db.relationship("Like", back_populates="post", cascade="all, delete-orphan")

    @property
    def likes_count(self):
        return len(self.likes)

    @property
    def comments_count(self):
        return len([c for c in self.comments if not c.is_deleted])

    def to_dict(self, current_user_id=None):
        is_liked = False
        if current_user_id:
            is_liked = any(
                str(like.user_id) == str(current_user_id) for like in self.likes
            )

        return {
            "id": str(self.id),
            "author": self.author.to_mini_dict() if self.author else None,
            "content": self.content,
            "is_reported": self.is_reported,
            "likes_count": self.likes_count,
            "comments_count": self.comments_count,
            "is_liked_by_me": is_liked,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
