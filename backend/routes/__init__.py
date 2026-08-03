from routes.auth_routes import auth_bp
from routes.customer_routes import customer_bp
from routes.policy_routes import policy_bp
from routes.claim_routes import claim_bp
from routes.premium_routes import premium_bp
from routes.document_routes import document_bp
from routes.report_routes import report_bp

__all__ = [
    'auth_bp',
    'customer_bp',
    'policy_bp',
    'claim_bp',
    'premium_bp',
    'document_bp',
    'report_bp'
]