from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import CheckInView, BulkEmailView, EventInfoView,RegisterAttendeeView,StatsView,AttendeeViewSet,check_in_attendee
from attendees import views


router = DefaultRouter()
router.register(r'list', AttendeeViewSet, basename='attendee-list')

urlpatterns = [
    path('', include(router.urls)),
path('check-in-window/', CheckInView.as_view(), name='check-in-window'),
    # 2. Simple Check-in (The one we built for the scanner)
    path('check-in/', check_in_attendee, name='simple-check-in'),
    path('send-tickets/', BulkEmailView.as_view(), name='send-tickets'),
    path('register/', RegisterAttendeeView.as_view(), name='register-attendee'),
    path('stats/', StatsView.as_view(), name='stats'),
    path('event-info/', EventInfoView.as_view(), name='event-info'),
    path('send-ticket/<int:attendee_id>/', views.resend_ticket_view, name='resend-ticket'),
    path('manual-checkin/<int:attendee_id>/', views.manual_checkin),
    path('window-stats/<int:window_id>/', views.window_stats_detail, name='window-stats'),
    path('import-guests/', views.ExcelImportView.as_view(), name='import-guests'),
]