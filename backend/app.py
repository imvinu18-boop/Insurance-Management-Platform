import os
from flask import Flask, jsonify
from config import Config
from extensions import db, jwt, bcrypt, cors, migrate, ma

# Import Blueprints safely from routes package
from routes import (
    auth_bp,
    customer_bp,
    policy_bp,
    claim_bp,
    premium_bp,
    document_bp,
    report_bp
)


def create_app():
    """
    App Factory pattern to initialize Flask application instance
    and register all core extensions & routes.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions with app context
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)

    # Ensure upload directory exists for storing PDFs/Documents
    upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)

    # Register Blueprints (API Endpoint Groups)
    app.register_blueprint(auth_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(policy_bp)
    app.register_blueprint(claim_bp)
    app.register_blueprint(premium_bp)
    app.register_blueprint(document_bp)
    app.register_blueprint(report_bp)

    # Import models inside app context to register all SQLAlchemy tables
    with app.app_context():
        try:
            import models  # Loads all models from models/__init__.py
            db.create_all()  # Auto-creates database tables if they do not exist
        except Exception as e:
            print(f"⚠️ Warning during database initialization: {e}")

    # API Health Check Endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "Healthy",
            "system": "Insurance Management Platform API",
            "version": "1.0.0"
        }), 200

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"message": "Requested resource/route not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"message": "Internal Server Error"}), 500

    return app


# ✅ Vercel needs this global app object
app = create_app()

if __name__ == '__main__':
    print("\n🚀 Insurance Management Platform Backend Server Starting...")
    print("📍 Health Check: http://127.0.0.1:5000/health\n")
    app.run(debug=True, port=5000)
