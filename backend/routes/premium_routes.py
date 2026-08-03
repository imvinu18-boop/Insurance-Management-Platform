from flask import Blueprint, request, jsonify
from extensions import db
from models.premium import PremiumPayment
from models.policy import Policy
from schemas.premium_schema import PremiumPaymentSchema
from flask_jwt_extended import jwt_required, get_jwt_identity

# Blueprint setup
premium_bp = Blueprint('premium_routes', __name__)
premium_schema = PremiumPaymentSchema()
premiums_schema = PremiumPaymentSchema(many=True)

# 📥 Get all payments (Filtered securely by user role & email)
@premium_bp.route('/api/premiums', methods=['GET'])
@premium_bp.route('/payments', methods=['GET'])
@jwt_required()
def get_premiums():
    try:
        current_user = get_jwt_identity()
        
        # Handle case where JWT identity can be an email string or a dictionary/object
        if isinstance(current_user, dict):
            user_email = current_user.get('email') or current_user.get('user_email')
            user_role = str(current_user.get('role', 'customer')).lower()
        else:
            # If identity is just stored as email string or ID, treat as customer unless specified
            user_email = str(current_user)
            user_role = 'customer'

        policy_id = request.args.get('policy_id')
        query = PremiumPayment.query
        
        if policy_id:
            query = query.filter_by(policy_id=policy_id)

        # 🔒 Security Check: If not Admin/Agent, strictly filter by logged-in user's email or their policies
        if user_role not in ['admin', 'agent']:
            if user_email:
                # Find policies belonging to this user first to ensure total isolation
                user_policies = Policy.query.filter_by(user_email=user_email).all()
                user_policy_ids = [p.id for p in user_policies]
                
                # Filter payments matching user's email OR user's policy IDs
                from sqlalchemy import or_
                if user_policy_ids:
                    query = query.filter(
                        or_(
                            PremiumPayment.user_email == user_email,
                            PremiumPayment.policy_id.in_(user_policy_ids)
                        )
                    )
                else:
                    query = query.filter_by(user_email=user_email)
            else:
                # Fallback if email is missing in token to prevent data leakage
                return jsonify([]), 200

        premiums = query.all()
        return jsonify(premiums_schema.dump(premiums)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 💳 Record new payment (Supports both /api/premiums and /payments)
@premium_bp.route('/api/premiums', methods=['POST'])
@premium_bp.route('/payments', methods=['POST'])
@jwt_required()
def record_premium():
    try:
        current_user = get_jwt_identity()
        user_email = current_user.get('email') if isinstance(current_user, dict) else str(current_user)

        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        policy_id = data.get('policy_id')
        paid_amount = float(data.get('amount', 0))

        # 🔍 Database se policy check karein
        policy = Policy.query.get(policy_id)
        if not policy:
            return jsonify({"error": f"Policy with ID {policy_id} not found."}), 404

        total_policy_amount = float(policy.coverage_amount or policy.premium_amount or 0)

        # 🧮 Calculate total already paid for this policy so far
        existing_payments = PremiumPayment.query.filter_by(policy_id=policy_id).all()
        total_paid_so_far = sum(float(p.amount) for p in existing_payments if p.payment_status == 'Paid')

        # 🛑 Validation: Check if policy is already fully paid
        if total_paid_so_far >= total_policy_amount:
            return jsonify({"error": "This policy is already fully paid!"}), 400

        remaining_balance = total_policy_amount - total_paid_so_far

        # 🛑 Validation: Ensure payment does not exceed remaining balance
        if paid_amount > remaining_balance:
            return jsonify({
                "error": f"Payment amount exceeds remaining balance of ₹{remaining_balance}"
            }), 400

        if paid_amount <= 0:
            return jsonify({"error": "Payment amount must be greater than zero."}), 400

        payment = PremiumPayment(
            policy_id=policy_id,
            amount=paid_amount,
            payment_status=data.get('payment_status', 'Paid'),
            payment_method=data.get('payment_method', 'UPI'),
            transaction_id=data.get('transaction_id'),
            user_email=data.get('user_email') or user_email
        )
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            "message": "Premium payment recorded successfully", 
            "payment": premium_schema.dump(payment)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500