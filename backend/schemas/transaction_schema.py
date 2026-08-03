from marshmallow import Schema, fields

class TransactionSchema(Schema):
    id = fields.Int(dump_only=True)
    policy_id = fields.Str(required=True)
    customer_name = fields.Str(dump_only=True)
    customer_email = fields.Str(dump_only=True)
    amount = fields.Float(required=True)
    payment_date = fields.Str()
    payment_status = fields.Str()
    payment_method = fields.Str()

transaction_schema = TransactionSchema()
transactions_schema = TransactionSchema(many=True)