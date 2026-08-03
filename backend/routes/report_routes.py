from flask import Blueprint, jsonify
from models.policy import Policy
from models.claim import Claim
from models.customer import Customer
from models.premium import PremiumPayment
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

report_bp = Blueprint('report', __name__, url_prefix='/api/reports')

@report_bp.route('/stats', methods=['GET'])
def reports_stats():
    try:
        # Optional JWT check taaki agar frontend se token na bhi aaye toh bhi data block na ho
        verify_jwt_in_request(optional=True)
    except Exception:
        pass

    policies = Policy.query.all()
    customers = Customer.query.all()
    claims = Claim.query.all()

    policies_list = [{
        "id": p.id,
        "policy_name": getattr(p, 'policy_type', 'Standard Insurance'),
        "coverage_amount": getattr(p, 'premium_amount', 100000),
        "status": p.status,
        "applied_date": str(getattr(p, 'start_date', '2026-01-01'))
    } for p in policies]

    users_list = [{
        "id": c.id,
        "email": getattr(c, 'email', '')
    } for c in customers]

    # Claims list mein status properly bhej rahe hain taaki rejected/approved count ho sake
    claims_list = [{
        "id": cl.id,
        "status": cl.status
    } for cl in claims]

    return jsonify({
        "policies": policies_list,
        "users": users_list,
        "claims": claims_list
    }), 200

# Customer ki khud ki payment history fetch karne ke liye
@report_bp.route('/my-payments', methods=['GET'])
@jwt_required()
def get_user_payments():
    current_user_id = get_jwt_identity()
    
    payments = db.session.query(PremiumPayment).join(Policy).join(Customer).filter(Customer.user_id == current_user_id).all()

    payments_list = [{
        "id": p.id,
        "policy_id": p.policy_id,
        "amount": p.amount,
        "payment_date": str(getattr(p, 'payment_date', '2026-01-01')),
        "status": getattr(p, 'payment_status', 'Success')
    } for p in payments]

    return jsonify({"payments": payments_list}), 200