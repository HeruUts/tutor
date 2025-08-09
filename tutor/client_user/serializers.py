from rest_framework import serializers
from .models import UserAchievement, User
# serializers.py

from .models import InteractionHistory
class SummaryHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InteractionHistory
        fields = ['username','timestamp','agent_response']
class InteractionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InteractionHistory
        fields = ['agent_response','username']  # Only allow this field from the request

class UserAchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAchievement
        fields = ['id', 'title', 'description', 'date', 'user']
        read_only_fields = ['id', 'user']

    def create(self, validated_data):
        # Set the user from the request context
        validated_data['user'] = self.context['request'].user
        return UserAchievement.objects.create(**validated_data)

class WeeklySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = InteractionHistory
        fields = ['username','timestamp','agent_response']