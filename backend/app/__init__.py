"""Flask application factory."""

import os
from flask import Flask
from app.config import config_by_name
from app.extensions import db, migrate, jwt, bcrypt, cors


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    flask_app = Flask(__name__)
    flask_app.config.from_object(config_by_name[config_name])
    flask_app.url_map.strict_slashes = False

    # Initialize extensions
    db.init_app(flask_app)
    migrate.init_app(flask_app, db)
    jwt.init_app(flask_app)
    bcrypt.init_app(flask_app)
    cors.init_app(flask_app, resources={r"/api/.*": {
        "origins": "*",
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }})

    # Import models so Alembic can see them
    with flask_app.app_context():
        import app.models  # noqa: F401

    # Register blueprints
    from app.routes import register_blueprints
    register_blueprints(flask_app)

    # JWT blocklist (in-memory for dev — use Redis in production)
    flask_app.config["JWT_BLOCKLIST"] = set()

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        return jti in flask_app.config["JWT_BLOCKLIST"]

    @flask_app.after_request
    def add_cache_control(response):
        from flask import request
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

    # Global error handlers
    @flask_app.errorhandler(404)
    def not_found(e):
        return {"success": False, "error": "Resource not found", "code": "NOT_FOUND"}, 404

    @flask_app.errorhandler(500)
    def server_error(e):
        return {"success": False, "error": "Internal server error", "code": "SERVER_ERROR"}, 500

    @flask_app.errorhandler(405)
    def method_not_allowed(e):
        return {"success": False, "error": "Method not allowed", "code": "METHOD_NOT_ALLOWED"}, 405

    return flask_app
