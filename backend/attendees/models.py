import uuid
import string
import random
from django.db import models
from django.contrib.auth.models import User

def generate_user_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

class Attendee(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    user_code = models.CharField(max_length=10, unique=True, default=generate_user_code)
    unique_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"{self.name} ({self.user_code})"



class Event(models.Model):
    name = models.CharField(max_length=200, default="Annual Gala 2026")
    date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

# Your existing CheckInWindow can now link to an Event
class CheckInWindow(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='windows')
    name = models.CharField(max_length=100) # e.g., "Main Entry", "Lunch"
    start_time = models.TimeField()
    end_time = models.TimeField()
    capacity = models.IntegerField(default=250)

class ScanLog(models.Model):
    attendee = models.ForeignKey(Attendee, on_delete=models.CASCADE)
    window = models.ForeignKey(CheckInWindow, on_delete=models.CASCADE)
    scanned_at = models.DateTimeField(auto_now_add=True)
    scanned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        unique_together = ('attendee', 'window') # Prevents double scanning