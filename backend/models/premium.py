from extensions import db
from datetime import datetime

class PremiumPayment(db.Model):
    __tablename__ = 'premium_payments'

    id = db.Column(db.Integer, primary_key=True)
    policy_id = db.Column(db.Integer, db.ForeignKey('policies.id'), nullable=False)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    amount = db.Column(db.Float, nullable=False)
    payment_status = db.Column(db.String(20), nullable=False) # 'Paid', 'Pending', 'Overdue'

    def to_dict(self):
        return {
            'id': self.id,
            'policy_id': self.policy_id,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'amount': self.amount,
            'payment_status': self.payment_status
        }