import qrcode
import os
from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string

def generate_qr_code(attendee):
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
    qr_path = generate_qr_code(attendee)
    
    subject = f"Your Entry Pass for the Event - {attendee.user_code}"
    body = f"Hi {attendee.name},\n\nPlease find your QR code attached. Show this at the entrance and lunch counter."
    
    email = EmailMessage(
        subject,
        body,
        settings.EMAIL_HOST_USER,
        [attendee.email],
    )
    
    # Attach the QR code image
    with open(qr_path, 'rb') as f:
        email.attach(f"{attendee.user_code}.png", f.read(), 'image/png')
    
    email.send()