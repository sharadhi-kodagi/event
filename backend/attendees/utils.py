# attendees/utils.py
import qrcode
import os
import base64
import io
from django.conf import settings
import resend

# Initialize Resend API (v3.x syntax)
resend.api_key = settings.RESEND_API_KEY

def generate_qr_code(attendee):
    """
    Generate QR code and save to file (same as original)
    """
    # Data encoded in QR is the unique token
    qr_data = str(attendee.unique_token)
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save path: /media/qrcodes/USER_CODE.png
    folder_path = os.path.join(settings.MEDIA_ROOT, 'qrcodes')
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        
    file_name = f"{attendee.user_code}.png"
    file_path = os.path.join(folder_path, file_name)
    img.save(file_path)
    return file_path

def send_ticket_email(attendee):
    """
    Send ticket email with QR code using Resend API (FREE)
    Same function signature as original - no other code changes needed!
    """
    from .models import Event
    
    # Get active event
    event = Event.objects.filter(is_active=True).first()
    if not event:
        raise ValueError("No active event found")
    
    # Generate QR code (same as original)
    qr_path = generate_qr_code(attendee)
    
    # Read QR image as base64 for attachment
    with open(qr_path, 'rb') as f:
        qr_bytes = f.read()
        qr_base64 = base64.b64encode(qr_bytes).decode('utf-8')
    
    # Prepare email content
    subject = f"Your Entry Pass for {event.name} - {attendee.user_code}"
    body = f"""Hi {attendee.name},

Thank you for registering for {event.name}!

Your ticket details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User Code : {attendee.user_code}
Email     : {attendee.email}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A QR code image is attached to this email (filename: {attendee.user_code}.png).
Show this QR code at the entrance gate OR provide your User Code above.

We look forward to seeing you at the event! 🎉

Best regards,
Event Team
"""
    
    try:
        # Send via Resend API v3.x (FREE - works on Render Free tier!)
        email = resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [attendee.email.strip()],
            "subject": subject,
            "text": body,
            "attachments": [
                {
                    "filename": f"{attendee.user_code}.png",
                    "content": qr_base64,
                }
            ]
        })
        
        print(f"✅ Email sent to {attendee.email} | ID: {email['id']}")
        return True
    
    except Exception as e:
        print(f"❌ Failed to send email to {attendee.email}: {str(e)}")
        raise
