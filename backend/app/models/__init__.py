"""Models package — import all models so Alembic discovers them."""

from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.models.match import Match
from app.models.post import Post
from app.models.comment import Comment
from app.models.like import Like
from app.models.notification import Notification
from app.models.message import Message

__all__ = [
    "User", "Skill", "UserSkill", "Match",
    "Post", "Comment", "Like", "Notification", "Message",
]
