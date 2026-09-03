from django.urls import path

from . import views


urlpatterns = [
    path('app/', views.app, name='insights-app'),
    path('api/health/', views.health, name='insights-health'),
    path('api/iframe/token/', views.iframe_token, name='insights-iframe-token'),
    path('api/session/me/', views.session_me, name='insights-session-me'),
    path('api/dashboard/summary/', views.dashboard_summary, name='insights-dashboard-summary'),
]
