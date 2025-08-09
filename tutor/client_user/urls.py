from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    user_login, 
    user_register, 
    get_current_user,
    LogoutView, 
    knowledge_view,
    UserAchievementView,
    InteractionHistoryCreateView,
    generate_weekly_summary,
)

router = DefaultRouter()
# router.register(r'api/achievements', UserAchievementViewSet, basename='achievement')

urlpatterns = [
    path('api/auth/login/', user_login),
    path('api/auth/register/', user_register),
    path('api/knowledge/', knowledge_view),
    path('api/auth/user/', get_current_user),
    path('api/auth/logout/', LogoutView.as_view()),
    path('api/achievements/', UserAchievementView.as_view(), name='user_achievements'),
    path('api/save-transcriptions/', InteractionHistoryCreateView.as_view()),
    path('api/generate-weekly-summary/', generate_weekly_summary),
]

# Include router URLs
urlpatterns += router.urls
