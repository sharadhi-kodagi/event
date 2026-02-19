from django.contrib import admin
from .models import Attendee, Event, CheckInWindow, ScanLog

@admin.register(Attendee)
class AttendeeAdmin(admin.ModelAdmin):
    # Remove 'is_checked_in' from this list:
    list_display = ('name', 'email', 'user_code', 'created_at') 
    search_fields = ('name', 'email', 'user_code')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('name', 'date', 'is_active')

@admin.register(CheckInWindow)
class CheckInWindowAdmin(admin.ModelAdmin):
    list_display = ('name', 'event', 'start_time', 'end_time', 'capacity')

@admin.register(ScanLog)
class ScanLogAdmin(admin.ModelAdmin):
    list_display = ('attendee', 'window', 'scanned_at', 'scanned_by')