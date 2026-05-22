"""Routes package — register all blueprints."""

from app.routes.auth import auth_bp
from app.routes.users import users_bp
from app.routes.skills import skills_bp
from app.routes.matches import matches_bp
from app.routes.posts import posts_bp
from app.routes.notifications import notifications_bp
from app.routes.messages import messages_bp
from app.routes.admin import admin_bp


def register_blueprints(flask_app):
    flask_app.register_blueprint(auth_bp)
    flask_app.register_blueprint(users_bp)
    flask_app.register_blueprint(skills_bp)
    flask_app.register_blueprint(matches_bp)
    flask_app.register_blueprint(posts_bp)
    flask_app.register_blueprint(notifications_bp)
    flask_app.register_blueprint(messages_bp)
    flask_app.register_blueprint(admin_bp)
