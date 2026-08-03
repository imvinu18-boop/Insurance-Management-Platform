from extensions import ma
from marshmallow import fields, validate

class PolicySchema(ma.Schema):
    id = fields.Int(dump_only=True)
    customer_id = fields.Int(required=True)
    policy_type = fields.Str(required=True, validate=validate.OneOf(['Health', 'Vehicle', 'Life', 'Travel', 'Property']))
    policy_number = fields.Str(required=True)
    premium_amount = fields.Float(required=True, validate=validate.Range(min=1.0, error="Premium amount must be greater than 0."))
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    status = fields.Str(validate=validate.OneOf(['Active', 'Expired', 'Cancelled']), load_default='Active')
    created_at = fields.DateTime(dump_only=True)