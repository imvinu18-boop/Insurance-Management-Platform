import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from extensions import db
from models.claim import Claim
from schemas.claim_schema import ClaimSchema
from flask_jwt_extended import jwt_required, get_jwt_identity

claim_bp = Blueprint('claim', __name__, url_prefix='/api/claims')
claim_schema = ClaimSchema()
claims_schema = ClaimSchema(many=True)

@claim_bp.route('', methods=['GET'])
@jwt_required()
def get_claims():
    policy_id = request.args.get('policy_id')
    status = request.args.get('status')
    
    query = Claim.query
    if policy_id:
        query = query.filter_by(policy_id=policy_id)
    if status:
        query = query.filter_by(status=status)

    claims = query.all()
    return jsonify(claims_schema.dump(claims)), 200

@claim_bp.route('', methods=['POST'])
@jwt_required()
def submit_claim():
    # 1. FormData ya JSON dono ko handle karne ke liye text data nikalna
    if request.content_type and 'multipart/form-data' in request.content_type:
        policy_id = request.form.get('policy_id')
        claim_amount = request.form.get('claim_amount')
        reason = request.form.get('reason')
    else:
        data = request.get_json() or {}
        policy_id = data.get('policy_id')
        claim_amount = data.get('claim_amount')
        reason = data.get('reason')

    if not policy_id or not claim_amount or not reason:
        return jsonify({"message": "Missing required fields (policy_id, claim_amount, reason)"}), 400

    # 2. Pehle files handle aur server ke folder mein save karne ka logic
    uploaded_files_dict = {}
    uploaded_files_list = []
    
    if request.files:
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)

        for key in request.files:
            file = request.files[key]
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                file_path = os.path.join(upload_folder, filename)
                file.save(file_path)
                
                # Key ke mutabik dictionary me store karenge taaki database me map kar sakein
                uploaded_files_dict[key] = filename
                uploaded_files_list.append(filename)

    # 3. Ab Claim object banate waqt files ke names bhi pass kar diye taaki database me save ho sakein
    new_claim = Claim(
        policy_id=policy_id,
        claim_amount=float(claim_amount),
        reason=reason,
        status='Pending',
        medical_bill=uploaded_files_dict.get('medical_bill'),
        policy_copy=uploaded_files_dict.get('policy_copy'),
        id_proof=uploaded_files_dict.get('id_proof')
    )
    
    db.session.add(new_claim)
    db.session.commit()

    return jsonify({
        "message": "Claim submitted successfully and saved in database", 
        "claim": claim_schema.dump(new_claim),
        "uploaded_files": uploaded_files_list
    }), 201

@claim_bp.route('/<int:claim_id>/status', methods=['PUT'])
@jwt_required()
def update_claim_status(claim_id):
    claim = Claim.query.get_or_404(claim_id)
    data = request.get_json() or {}
    reviewer_id = int(get_jwt_identity())

    new_status = data.get('status')
    if new_status not in ['Approved', 'Rejected']:
        return jsonify({"message": "Status must be Approved or Rejected"}), 400

    claim.status = new_status
    claim.reviewed_by = reviewer_id
    db.session.commit()
    
    return jsonify({
        "message": f"Claim status updated to {new_status}", 
        "claim": claim_schema.dump(claim)
    }), 200