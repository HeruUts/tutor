from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import JSONField

class WeeklySummary(models.Model):
    """Stores weekly summary data"""

    username = models.CharField(max_length=255)
    period_start = models.DateField()
    period_end = models.DateField()
    summary = models.JSONField(default=dict)
    create_at = models.DateTimeField(auto_now_add=True)
class User(AbstractUser):
    """Extended user model with persona data"""
    persona_data = JSONField(default=dict, blank=True)  # Stores user preferences, characteristics
    
    def get_recent_interactions(self, limit=5):
        """Get last N interactions"""
        return self.interactions.all().order_by('-timestamp')[:limit]
    
    def get_latest_achievement(self):
        """Get most recent unlocked achievement"""
        return self.achievements.filter(is_new=True).first()
    
    def get_persona_context(self):
        """Formats user data for LLM context"""
        return {
            "preferences": self.persona_data,
            "recent_interactions": [i.agent_response for i in self.get_recent_interactions()],
            "current_achievement": self.get_latest_achievement().details if self.get_latest_achievement() else None
        }
    
    class Meta:
        verbose_name = "Voice Assistant User"
        verbose_name_plural = "Voice Assistant Users"
class InteractionHistory(models.Model):
    """Stores all user-agent interactions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interactions')
    session_id = models.CharField(max_length=255)  # Matches LiveKit session
    timestamp = models.DateTimeField(auto_now_add=True)
    username = models.TextField(blank=True, null=True)
    input_audio_duration = models.FloatField(blank=True, null=True)  # seconds
    agent_response = models.TextField()
    response_audio_url = models.URLField(blank=True, null=True)
    metadata = JSONField(default=dict)  # Additional context
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'timestamp']),
        ]
        ordering = ['-timestamp']

class UserAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_achievements')
    title = models.CharField(max_length=255,blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class SummaryOfHistory(models.Model):
    username = models.CharField(max_length=255)
    period_start = models.DateField()
    period_end = models.DateField()
    summary = models.JSONField(default=dict)
    create_at = models.DateTimeField(auto_now_add=True)