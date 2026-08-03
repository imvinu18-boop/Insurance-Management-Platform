import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from flask import current_app

def generate_policy_pdf(policy_data, customer_data):
    """
    Generates a PDF Policy Certificate for a customer.
    """
    filename = f"Policy_{policy_data['policy_number']}.pdf"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

    c = canvas.Canvas(filepath, pagesize=letter)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(180, 750, "INSURANCE POLICY CERTIFICATE")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, 700, f"Policy Number: {policy_data['policy_number']}")
    c.drawString(50, 680, f"Policy Type: {policy_data['policy_type']}")
    c.drawString(50, 660, f"Customer Name: {customer_data['name']}")
    c.drawString(50, 640, f"Premium Amount: ₹{policy_data['premium_amount']}")
    c.drawString(50, 620, f"Start Date: {policy_data['start_date']}")
    c.drawString(50, 600, f"End Date: {policy_data['end_date']}")
    c.drawString(50, 580, f"Status: {policy_data['status']}")

    c.drawString(50, 500, "Thank you for choosing our Insurance Platform!")
    c.save()

    return filepath, filename


def generate_claim_receipt_pdf(claim_data):
    """
    Generates a Claim Acknowledgement Receipt PDF.
    """
    filename = f"Claim_Receipt_{claim_data['id']}.pdf"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

    c = canvas.Canvas(filepath, pagesize=letter)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(200, 750, "CLAIM ACKNOWLEDGEMENT")

    c.setFont("Helvetica", 12)
    c.drawString(50, 700, f"Claim ID: #{claim_data['id']}")
    c.drawString(50, 680, f"Policy ID: {claim_data['policy_id']}")
    c.drawString(50, 660, f"Claim Amount: ₹{claim_data['claim_amount']}")
    c.drawString(50, 640, f"Status: {claim_data['status']}")
    c.drawString(50, 620, f"Reason: {claim_data['reason']}")

    c.save()
    return filepath, filename