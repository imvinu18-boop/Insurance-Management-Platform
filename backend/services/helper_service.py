import random
import string
from datetime import datetime

def generate_policy_number(policy_type="GEN"):
    """
    Generates a unique Policy Code. E.g., POL-HEALTH-2026-9281
    """
    type_code = policy_type[:3].upper() if policy_type else "GEN"
    year = datetime.now().year
    random_digits = ''.join(random.choices(string.digits, k=4))
    return f"POL-{type_code}-{year}-{random_digits}"