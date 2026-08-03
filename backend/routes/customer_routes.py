from flask import Blueprint, request, jsonify
from extensions import db
from models.customer import Customer
from schemas.customer_schema import CustomerSchema
from flask_jwt_extended import jwt_required

customer_bp = Blueprint('customer', __name__, url_prefix='/api/customers')
customer_schema = CustomerSchema()
customers_schema = CustomerSchema(many=True)

@customer_bp.route('', methods=['GET'])
@jwt_required()
def get_all_customers():
    search = request.args.get('search', '')
    if search:
        customers = Customer.query.filter(
            (Customer.name.ilike(f'%{search}%')) | (Customer.email.ilike(f'%{search}%'))
        ).all()
    else:
        customers = Customer.query.all()
    return jsonify(customers_schema.dump(customers)), 200

@customer_bp.route('/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    return jsonify(customer_schema.dump(customer)), 200

@customer_bp.route('', methods=['POST'])
@jwt_required()
def create_customer():
    data = request.get_json()
    errors = customer_schema.validate(data)
    if errors:
        return jsonify({"errors": errors}), 400

    if Customer.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Customer with this email already exists"}), 400

    new_customer = Customer(
        user_id=data.get('user_id'),
        name=data['name'],
        dob=data['dob'],
        phone=data['phone'],
        address=data['address'],
        email=data['email']
    )
    db.session.add(new_customer)
    db.session.commit()
    return jsonify({"message": "Customer created successfully", "customer": customer_schema.dump(new_customer)}), 201

@customer_bp.route('/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    data = request.get_json()

    customer.name = data.get('name', customer.name)
    customer.dob = data.get('dob', customer.dob)
    customer.phone = data.get('phone', customer.phone)
    customer.address = data.get('address', customer.address)

    db.session.commit()
    return jsonify({"message": "Customer updated successfully", "customer": customer_schema.dump(customer)}), 200