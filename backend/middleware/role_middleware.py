from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_jwt_header_token

def role_required(allowed_roles):
    """
    Generic decorator to restrict access based on user roles.
    Usage: @role_required(['admin', 'agent'])
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Ensure JWT token is valid
            verify_jwt_in_jwt_header_token()
            claims = get_jwt()
            user_role = claims.get('role', 'customer')

            if user_role not in allowed_roles:
                return jsonify({
                    "message": "Access denied: Unauthorized role",
                    "required_roles": allowed_roles,
                    "your_role": user_role
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required():
    """
    Shortcut decorator for Admin-only routes.
    """
    return role_required(['admin'])


def agent_required():
    """
    Shortcut decorator for Admin & Agent routes.
    """
    return role_required(['admin', 'agent'])