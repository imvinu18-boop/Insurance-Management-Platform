from functools import wraps
from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_jwt_header_token, get_jwt_identity, get_jwt
from models.user import User

def token_required(fn):
    """
    Custom authentication decorator that validates JWT token
    and attaches the current User object to Flask's global 'g' context.
    """
    @wraps(fn)
    def decorator(*args, **kwargs):
        try:
            # 1. Verify JWT token from Request Header
            verify_jwt_in_jwt_header_token()
            
            # 2. Extract User ID from Token Identity
            user_id = int(get_jwt_identity())
            
            # 3. Fetch User from Database
            current_user = User.query.get(user_id)
            if not current_user:
                return jsonify({"message": "User account no longer exists"}), 401

            # 4. Attach user object to global request context 'g'
            g.current_user = current_user
            
        except Exception as e:
            return jsonify({"message": "Invalid or expired token", "error": str(e)}), 401

        return fn(*args, **kwargs)
    return decorator