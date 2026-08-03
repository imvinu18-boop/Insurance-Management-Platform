from extensions import ma
from marshmallow import fields, validate

class ClaimSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    policy_id = fields.Int(required=True)
    claim_amount = fields.Float(required=True, validate=validate.Range(min=1.0, error="Claim amount must be greater than 0."))
    reason = fields.Str(required=True, validate=validate.Length(min=10, error="Please provide a detailed reason (at least 10 characters)."))
    status = fields.Str(validate=validate.OneOf(['Pending', 'Approved', 'Rejected']), load_default='Pending')
    submission_date = fields.DateTime(dump_only=True)
    reviewed_by = fields.Int(dump_only=True, allow_none=True)