from extensions import ma
from marshmallow import fields, validate

class CustomerSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(allow_none=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    dob = fields.Str(required=True)
    phone = fields.Str(required=True, validate=validate.Regexp(r'^\+?[0-9]{10,15}$', error="Invalid phone number format."))
    address = fields.Str(required=True, validate=validate.Length(min=5))
    email = fields.Email(required=True)
    created_at = fields.DateTime(dump_only=True)