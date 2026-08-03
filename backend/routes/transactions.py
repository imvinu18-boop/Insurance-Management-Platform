from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
# Apne models ke anusaar import karein (jaise PremiumPayments, User, Policy)
from models import db, PremiumPayments, Policy, User

transactions_bp = Blueprint('transactions_bp', __name__)

@transactions_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    current_user_email = get_jwt_identity()
    
    # User ka role check karne ke liye current user find karein
    current_user = User.query.filter_by(email=current_user_email).first()
    
    if not current_user:
        return jsonify({"error": "User not found"}), 404
        
    role = str(current_user.role).lower()
    
    # Agar user Admin ya Agent hai, toh saari transactions/payments return karein
    if role in ['admin', 'agent']:
        payments = PremiumPayments.query.all()
    else:
        # Agar customer hai, toh sirf uski policies ki payments return karein
        # (Yahan aap apne database relation ke mutabiq query adjust kar sakte hain)
        user_policies = Policy.query.filter_by(customer_id=current_user.id).all()
        policy_ids = [p.id for p in user_policies]
        payments = PremiumPayments.query.filter(PremiumPayments.policy_id.in_(policy_ids)).all()
        
    result = []
    for payment in payments:
        policy = Policy.query.get(payment.policy_id)
        customer = User.query.get(policy.customer_id) if policy else None
        
        result.append({
            "id": payment.id,
            "policy_id": policy.policy_number if policy else str(payment.policy_id),
            "customer_name": customer.name if customer else "N/A",
            "customer_email": customer.email if customer else "N/A",
            "amount": payment.amount,
            "payment_date": str(payment.payment_date),
            "payment_status": getattr(payment, 'payment_status', 'Completed'),
            "payment_method": getattr(payment, 'payment_method', 'Online Gateway')
        })
        
    return jsonify(result), 200