import os
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from extensions import db
from models.document import Document
from schemas.document_schema import DocumentSchema
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

document_bp = Blueprint('document', __name__, url_prefix='/api/documents')
document_schema = DocumentSchema()
documents_schema = DocumentSchema(many=True)

@document_bp.route('', methods=['GET'])
@jwt_required()
def get_documents():
    customer_id = request.args.get('customer_id')
    if customer_id:
        docs = Document.query.filter_by(customer_id=customer_id).all()
    else:
        docs = Document.query.all()
    return jsonify(documents_schema.dump(docs)), 200

@document_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_document():
    if 'file' not in request.files:
        return jsonify({"message": "No file part in request"}), 400

    file = request.files['file']
    customer_id = request.form.get('customer_id')
    doc_type = request.form.get('document_type', 'Other')

    if not file or file.filename == '':
        return jsonify({"message": "No file selected"}), 400

    filename = secure_filename(file.filename)
    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    doc = Document(
        customer_id=customer_id,
        file_name=filename,
        file_path=file_path,
        document_type=doc_type
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify({"message": "File uploaded successfully", "document": document_schema.dump(doc)}), 201

@document_bp.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)