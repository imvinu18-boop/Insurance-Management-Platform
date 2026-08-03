from extensions import db
from models.user import User
from models.customer import Customer
from models.policy import Policy
from models.claim import Claim
from models.premium import PremiumPayment
from models.document import Document

__all__ = ['db', 'User', 'Customer', 'Policy', 'Claim', 'PremiumPayment', 'Document']
