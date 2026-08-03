from flask import Blueprint, request, jsonify
from extensions import db
from models.policy import Policy
from schemas.policy_schema import PolicySchema
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta

policy_bp = Blueprint('policy', __name__, url_prefix='/api/policies')
policy_schema = PolicySchema()
policies_schema = PolicySchema(many=True)

@policy_bp.route('', methods=['GET'])
@jwt_required()
def get_policies():
    customer_id = request.args.get('customer_id')
    status = request.args.get('status')
    
    query = Policy.query
    if customer_id:
        query = query.filter_by(customer_id=customer_id)
    if status:
        query = query.filter_by(status=status)
        
    policies = query.all()
    return jsonify(policies_schema.dump(policies)), 200

@policy_bp.route('', methods=['POST'])
@jwt_required()
def create_policy():
    data = request.get_json()
    errors = policy_schema.validate(data)
    if errors:
        return jsonify({"errors": errors}), 400

    new_policy = Policy(
        customer_id=data['customer_id'],
        policy_type=data['policy_type'],
        policy_number=data['policy_number'],
        premium_amount=data['premium_amount'],
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
        status=data.get('status', 'Active')
    )
    db.session.add(new_policy)
    db.session.commit()
    return jsonify({"message": "Policy issued successfully", "policy": policy_schema.dump(new_policy)}), 201

@policy_bp.route('/<int:policy_id>/renew', methods=['PUT'])
@jwt_required()
def renew_policy(policy_id):
    policy = Policy.query.get_or_404(policy_id)
    # Add 1 year to end_date
    policy.end_date = policy.end_date + timedelta(days=365)
    policy.status = 'Active'
    db.session.commit()
    return jsonify({"message": "Policy renewed for 1 year", "policy": policy_schema.dump(policy)}), 200

@policy_bp.route('/<int:policy_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_policy(policy_id):
    policy = Policy.query.get_or_404(policy_id)
    policy.status = 'Cancelled'
    db.session.commit()
    return jsonify({"message": "Policy cancelled successfully", "policy": policy_schema.dump(policy)}), 200