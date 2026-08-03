from datetime import date
from extensions import db
from models.policy import Policy

def check_policy_expirations():
    """
    Checks all policies and sets status to 'Expired' if end_date has passed.
    """
    today = date.today()
    expired_policies = Policy.query.filter(Policy.end_date < today, Policy.status == 'Active').all()
    
    count = 0
    for policy in expired_policies:
        policy.status = 'Expired'
        count += 1
        
    db.session.commit()
    return {"message": f"Updated {count} expired policies."}