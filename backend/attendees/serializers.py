import uuid
import random
import string
from rest_framework import serializers
from .models import Attendee, ScanLog

class AttendeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendee
        fields = ['id', 'name', 'email', 'phone_number'] # Only fields from frontend

    def get_checkin_status(self, obj):
        # This returns which windows this person has already scanned into
        logs = ScanLog.objects.filter(attendee=obj).values_list('window__name', flat=True)
        return list(logs)

    def create(self, validated_data):
        # Generate unique codes here if not handled in the model's save() method
        validated_data['unique_token'] = str(uuid.uuid4())
        validated_data['user_code'] = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return super().create(validated_data)