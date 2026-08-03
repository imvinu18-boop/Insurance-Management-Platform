from extensions import ma
from marshmallow import fields, validate

class DocumentSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    customer_id = fields.Int(required=True)
    file_name = fields.Str(required=True)
    file_path = fields.Str(required=True)
    document_type = fields.Str(validate=validate.OneOf(['ID Proof', 'Claim Receipt', 'Medical Record', 'Policy Document', 'Other']), load_default='Other')
    uploaded_at = fields.DateTime(dump_only=True)