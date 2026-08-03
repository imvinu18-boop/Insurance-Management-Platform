from extensions import ma
from marshmallow import fields, validate

class UserSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=6))
    role = fields.Str(validate=validate.OneOf(['admin', 'agent', 'customer']), load_default='customer')
    created_at = fields.DateTime(dump_only=True)