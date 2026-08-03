from extensions import ma,db
from marshmallow import fields, validate
from datetime import datetime
# Model mein field definition aisi ho sakti hai:
class PremiumPaymentSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    policy_id = fields.Int(required=True)
    user_email = fields.Email(required=False, allow_none=True)
    amount = fields.Float(required=True, validate=validate.Range(min=1.0))
    payment_status = fields.Str(required=True, validate=validate.OneOf(['Paid', 'Pending', 'Overdue', 'Failed']))
    payment_method = fields.Str(required=False, validate=validate.OneOf(['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash']), allow_none=True)
    transaction_id = fields.Str(required=False, allow_none=True)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    