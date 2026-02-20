from rest_framework.views import APIView
from rest_framework.response import Response
from urllib.parse import quote
from rest_framework import generics
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.utils import timezone
from .models import Attendee, CheckInWindow, ScanLog
from .utils import send_ticket_email
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from rest_framework.permissions import AllowAny # Import this
from .models import Attendee,Event
from .serializers import AttendeeSerializer


# 1. The view for Admins to scan QR codes
class CheckInView(APIView):
    def post(self, request):
        token = request.data.get('token')
        
        try:
            attendee = Attendee.objects.get(unique_token=token)
        except Attendee.DoesNotExist:
            return Response({"message": "Invalid QR Code"}, status=status.HTTP_404_NOT_FOUND)

        # Logic to find the active window based on current time
        now = timezone.now().time()
        window = CheckInWindow.objects.filter(start_time__lte=now, end_time__gte=now).first()

        if not window:
            return Response({"message": "No active scan window right now"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already scanned
        if ScanLog.objects.filter(attendee=attendee, window=window).exists():
            return Response({
                "message": f"Already checked in for {window.name}",
                "name": attendee.name
            }, status=status.HTTP_400_BAD_REQUEST)

        # Success: Log it
        ScanLog.objects.create(
            attendee=attendee, 
            window=window, 
            scanned_by=request.user if request.user.is_authenticated else None
        )
        
        return Response({
            "message": "Check-in Successful!",
            "name": attendee.name,
            "code": attendee.user_code,
            "event": window.name
        }, status=status.HTTP_200_OK)

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .models import Attendee, Event
import logging

logger = logging.getLogger(__name__)


from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Attendee
from django.utils import timezone

from django.utils import timezone
from .models import Attendee, CheckInWindow, ScanLog

from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Attendee, CheckInWindow, ScanLog

@api_view(['POST'])
def check_in_attendee(request):
    token = request.data.get('token')
    
    try:
        attendee = Attendee.objects.get(unique_token=token)
    except Attendee.DoesNotExist:
        return Response({"status": "error", "message": "Invalid Ticket!"}, status=404)

    # 1. Identify the current active Window based on server time
    now = timezone.now().time()
    active_window = CheckInWindow.objects.filter(
        start_time__lte=now, 
        end_time__gte=now
    ).first()

    if not active_window:
        return Response({
            "status": "closed",
            "message": "No active entry slot right now (e.g., between 11am-12pm)."
        }, status=400)

    # 2. Check if this Attendee has already scanned for THIS specific window
    already_scanned = ScanLog.objects.filter(
        attendee=attendee, 
        window=active_window
    ).exists()

    if already_scanned:
        return Response({
            "status": "already_done",
            "message": f"Already checked in for {active_window.name}!",
            "name": attendee.name
        }, status=200)

    # 3. Success: Create a new log entry for this session
    ScanLog.objects.create(
        attendee=attendee,
        window=active_window,
        scanned_by=request.user if request.user.is_authenticated else None
    )
    
    return Response({
        "status": "success",
        "message": f"Welcome to {active_window.name}!",
        "name": attendee.name,
        "window": active_window.name
    }, status=200)


class BulkEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # 1. Fetch the Active Event
        event = Event.objects.filter(is_active=True).first()
        if not event:
            return Response({"error": "No active event found. Please activate an event in Admin."}, status=400)

        # 2. Fetch all attendees who haven't received a ticket (optional filter)
        attendees = Attendee.objects.all()
        if not attendees.exists():
            return Response({"message": "No attendees found to email."}, status=200)

        success_count = 0
        fail_count = 0

        for attendee in attendees:
            try:
                subject = f"Your Entry Ticket for {event.name}"
                clean_email = attendee.email.strip() # <--- Add this line
                # The template we created earlier
                context = {
                    'event_name': event.name,
                    'attendee_name': attendee.name,
                    'unique_token': quote(str(attendee.unique_token)),
                    'user_code': attendee.user_code,
                    'email': clean_email
                }
                
                html_content = render_to_string('ticket_email.html', context)
                text_content = strip_tags(html_content)

                msg = EmailMultiAlternatives(
                    subject, 
                    text_content, 
                    None, # Uses DEFAULT_FROM_EMAIL from settings
                    [clean_email]
                )
                msg.attach_alternative(html_content, "text/html")
                msg.send()
                
                success_count += 1
            except Exception as e:
                logger.error(f"Failed to send email to {attendee.email}: {str(e)}")
                fail_count += 1

        return Response({
            "message": f"Bulk email process completed.",
            "details": f"Successfully sent: {success_count}, Failed: {fail_count}"
        })
    



class RegisterAttendeeView(generics.CreateAPIView):
    queryset = Attendee.objects.all()
    serializer_class = AttendeeSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Save the user first
        attendee = serializer.save()
        # Automatically send the QR code email immediately
        try:
            send_ticket_email(attendee)
        except Exception as e:
            print(f"Email failed: {e}")

class StatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Count all scan logs in the database
        total_scans = ScanLog.objects.count()
        
        # Optional: You can add more detailed stats here for your charts
        return Response({
            "total_scans": total_scans,
        })
    


import csv
import io
from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Attendee

class ExcelImportView(APIView):
    parser_classes = [MultiPartParser] # Allows file uploads

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=400)

        # Read the CSV file
        decoded_file = file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        created_count = 0
        errors = []

        for row in reader:
            try:
                # Expecting columns: name, email, phone
                Attendee.objects.create(
                    name=row.get('name'),
                    email=row.get('email'),
                    phone_number=row.get('phone')
                )
                created_count += 1
            except Exception as e:
                errors.append(f"Error for {row.get('email')}: {str(e)}")

        return Response({
            "message": f"Successfully imported {created_count} guests!",
            "errors": errors
        })
    

class AttendeeViewSet(viewsets.ModelViewSet):
    queryset = Attendee.objects.all().order_by('-id')  # Newest attendees first
    serializer_class = AttendeeSerializer
    permission_classes = [AllowAny]  # Only logged-in admins/superusers can access



class EventInfoView(APIView):
    def get(self, request):
        event = Event.objects.filter(is_active=True).first()
        if not event:
            return Response({"name": "No Active Event", "windows": []})

        windows = event.windows.all()
        window_data = []
        for w in windows:
            window_data.append({
                "id": w.id,  # <--- MAKE SURE THIS IS HERE
                "name": w.name,
                "current_count": ScanLog.objects.filter(window=w).count(),
                "capacity": w.capacity,
                "start_time": w.start_time.strftime("%H:%M"),
                "end_time": w.end_time.strftime("%H:%M"),
            })

        return Response({
            "name": event.name,
            "windows": window_data
        })
    

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Attendee, Event
from .utils import send_ticket_email # Reusing your existing email logic
import qrcode
import io
import gc  # Garbage Collector
from django.core.mail import EmailMessage
from django.conf import settings

@api_view(['POST'])
def send_individual_email(request, attendee_id):
    attendee = get_object_or_404(Attendee, id=attendee_id)
    event = Event.objects.filter(is_active=True).first()
    
    try:
        # Call the email function you've already built
        send_ticket_email(attendee, event)
        return Response({"message": f"Ticket sent to {attendee.email}"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['POST'])
def resend_ticket_view(request, attendee_id):
    attendee = get_object_or_404(Attendee, id=attendee_id)
    
    try:
        # 1. Create a SMALL QR code (box_size 5 instead of 10)
        qr = qrcode.QRCode(version=1, box_size=5, border=2)
        qr.add_data(str(attendee.unique_token))
        qr.make(fit=True)
        
        # 2. Use a context manager for the image to ensure it closes
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        image_data = buffer.getvalue()
        
        # 3. Explicitly delete heavy objects and clear RAM
        del img
        del qr
        gc.collect() 

        # 4. Prepare Email
        subject = f"Your Entry Pass for Rotract Event"
        email = EmailMessage(
            subject,
            f"Hello {attendee.name}, find your ticket attached.",
            settings.DEFAULT_FROM_EMAIL,
            [attendee.email]
        )
        email.attach(f'ticket_{attendee.user_code}.png', image_data, 'image/png')
        
        # 5. Send
        email.send(fail_silently=False)
        
        # 6. Final cleanup
        buffer.close()
        
        return Response({"message": "Sent successfully!"})
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)
        
    

@api_view(['POST'])
def manual_checkin(request, attendee_id):
    attendee = get_object_or_404(Attendee, id=attendee_id)
    
    # Identify which window we are checking into. 
    # Usually, we check into the currently active window.
    window = CheckInWindow.objects.filter(event__is_active=True).first() 
    
    if not window:
        return Response({"error": "No active event window found"}, status=400)

    try:
        # Create a log entry. Unique_together constraint handles the 'Already Scanned' logic.
        ScanLog.objects.create(
            attendee=attendee,
            window=window,
            scanned_by=request.user if request.user.is_authenticated else None
        )
        return Response({"message": f"Checked in for {window.name}"}, status=200)
    except Exception:
        return Response({"error": f"Already checked in for {window.name}"}, status=400)
    

@api_view(['GET'])
def window_stats_detail(request, window_id):
    window = get_object_or_404(CheckInWindow, id=window_id)
    
    # Get all attendees and their specific log for THIS window
    attendees = Attendee.objects.all()
    logs = ScanLog.objects.filter(window=window).select_related('attendee')
    
    scanned_ids = logs.values_list('attendee_id', flat=True)
    
    data = []
    for person in attendees:
        log = next((l for l in logs if l.attendee_id == person.id), None)
        data.append({
            "id": person.id,
            "name": person.name,
            "email": person.email,
            "scanned": person.id in scanned_ids,
            "timestamp": log.scanned_at.strftime("%H:%M") if log else None
        })
    
    return Response({
        "window_name": window.name,
        "attendees": data

    })

