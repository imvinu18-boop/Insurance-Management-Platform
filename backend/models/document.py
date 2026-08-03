from extensions import db
from datetime import datetime

class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    document_type = db.Column(db.String(50), nullable=True) # e.g., 'ID Proof', 'Claim Receipt'
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'file_name': self.file_name,
            'file_path': self.file_path,
            'document_type': self.document_type,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }