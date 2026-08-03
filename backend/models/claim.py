from extensions import db
from datetime import datetime

class Claim(db.Model):
    __tablename__ = 'claims'

    id = db.Column(db.Integer, primary_key=True)
    policy_id = db.Column(db.Integer, db.ForeignKey('policies.id'), nullable=False)
    claim_amount = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='Pending', nullable=False) # 'Pending', 'Approved', 'Rejected'
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Agent or Admin who reviewed

    # 📂 Naye columns files / documents ke liye
    medical_bill = db.Column(db.String(255), nullable=True)
    policy_copy = db.Column(db.String(255), nullable=True)
    id_proof = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'policy_id': self.policy_id,
            'claim_amount': self.claim_amount,
            'reason': self.reason,
            'status': self.status,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None,
            'reviewed_by': self.reviewed_by,
            # 📂 Dictionary mein bhi files include kar di hain
            'medical_bill': self.medical_bill,
            'policy_copy': self.policy_copy,
            'id_proof': self.id_proof
        }