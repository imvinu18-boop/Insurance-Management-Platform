from extensions import db
from datetime import datetime

class Policy(db.Model):
    __tablename__ = 'policies'

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    policy_type = db.Column(db.String(50), nullable=False) # e.g., 'Health', 'Vehicle', 'Life'
    policy_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    premium_amount = db.Column(db.Float, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='Active', nullable=False) # 'Active', 'Expired', 'Cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    claims = db.relationship('Claim', backref='policy', lazy=True, cascade="all, delete-orphan")
    premiums = db.relationship('PremiumPayment', backref='policy', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'policy_type': self.policy_type,
            'policy_number': self.policy_number,
            'premium_amount': self.premium_amount,
            'start_date': self.start_date.strftime('%Y-%m-%d') if self.start_date else None,
            'end_date': self.end_date.strftime('%Y-%m-%d') if self.end_date else None,
            'status': self.status
        }