import json
import logging
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView

from .models import User, InteractionHistory, UserAchievement
from .serializers import UserAchievementSerializer
from .utils import get_personalized_knowledge_summary, get_relevant_user_data

from .models import UserAchievement
# views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import InteractionHistory
from .serializers import InteractionHistorySerializer

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import InteractionHistory, WeeklySummary
from .serializers import InteractionHistorySerializer, WeeklySummarySerializer
import logging

logger = logging.getLogger(__name__)

from datetime import timedelta
from django.utils import timezone
from .utils import summarize_with_llama2

@api_view(['GET'])
def generate_weekly_summary(request, username):
    today = timezone.now().date()
    weekday = today.weekday()  # Monday = 0, Sunday = 6

    # Go back to the most recent Monday
    start_date = today - timedelta(days=weekday)
    # End date is the upcoming Sunday
    end_date = start_date + timedelta(days=6)

    # Check if already summarized
    summary_exists = WeeklySummary.objects.filter(
        username=username,
        period_start=start_date,
        period_end=end_date
    ).first()

    if summary_exists:
        serializer = WeeklySummarySerializer(summary_exists)
        return Response(serializer.data)

    # Collect history
    interactions = InteractionHistory.objects.filter(
        username=username,
        timestamp__date__range=[start_date, end_date]
    ).order_by('timestamp')

    if not interactions.exists():
        return Response({"message": "No interactions found for the user."})

    all_responses = "\n".join([i.agent_response for i in interactions])
    prompt = f"""
    Summarize the following agent responses from the user '{username}' between {start_date} and {end_date}:

    {all_responses}

    Provide a concise summary of the key points and topics discussed.
    """

    summary_text = summarize_with_llama2(prompt)

    # Save to DB
    weekly_summary = WeeklySummary.objects.create(
        username=username,
        period_start=start_date,
        period_end=end_date,
        summary_text=summary_text
    )

    serializer = WeeklySummarySerializer(weekly_summary)
    return Response(serializer.data)

class InteractionHistoryCreateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.debug("Incoming POST data: %s", request.data)
        logger.debug("Authenticated user: %s", request.user)

        serializer = InteractionHistorySerializer(data=request.data, context={'request': request})
        #print(request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            logger.debug("Interaction history saved successfully.")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error("Serializer validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserAchievementView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UserAchievementSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            achievement = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        achievements = UserAchievement.objects.filter(user=request.user)
        serializer = UserAchievementSerializer(achievements, many=True)
        return Response(serializer.data)

class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Delete the token - this will force the user to login again
            request.auth.delete()  # Delete the token used for this request
            return Response(
                {"success": "Successfully logged out."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            return JsonResponse({
                'status': 'success',
                'user': {
                    'id': user.id,
                    'username': user.username
                }
            })
        else:
            return JsonResponse({'status': 'error'}, status=401)
    
    return JsonResponse({'error': 'Invalid method'}, status=405)

@api_view(['POST'])
@csrf_exempt
def user_register(request):
    data = json.loads(request.body)
    
    try:
        user = User.objects.create_user(
            username=data['username'],
            password=data['password'],
            email=data.get('email', ''),
            persona_data=data.get('persona_data', {})
        )
        
        return Response({
            "id": user.id,
            "username": user.username,
            "persona_data": user.persona_data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


def get_current_user(request):

    
    response = JsonResponse({
        "id": request.user.id,
        "username": request.user.username,
        
    })
    print(request.user.id)
    print(request.user.username)
    response["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response["Access-Control-Allow-Credentials"] = "true"
    return response


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def knowledge_view(request):
    query = request.GET.get('q', '').strip()
    user = request.user
    
    # Validate query
    if not query:
        return Response(
            {"error": "Query parameter 'q' is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate cache key with user context
    cache_key = f"knowledge_{user.id}_{query[:100]}"  # Limit query length in key
    
    # Check cache
    if cached := cache.get(cache_key):
        logger.debug(f"Cache hit for {cache_key}")
        # Log the cached knowledge access
        InteractionHistory.objects.create(
            user=user,
            session_id=request.GET.get('session_id', ''),
            input_text=f"Cached knowledge query: {query}",
            agent_response="",
            metadata={"type": "cached_knowledge", "query": query}
        )
        return Response(cached)
    
    try:
        # Get personalized knowledge results
        results = {
            "summary": get_personalized_knowledge_summary(query, user),
            "data": get_relevant_user_data(query, user),
            "user_context": user.get_persona_context()  # Include user's personal context
        }
        
        # Cache for 1 hour (3600 seconds)
        cache.set(cache_key, results, 3600)
        
        # Log the new knowledge query
        InteractionHistory.objects.create(
            user=user,
            session_id=request.GET.get('session_id', ''),
            input_text=f"New knowledge query: {query}",
            agent_response=results["summary"][:200],  # Store first 200 chars
            metadata={
                "type": "knowledge_query",
                "query": query,
                "cache_key": cache_key
            }
        )
        
        return Response(results)
        
    except Exception as e:
        logger.error(f"Knowledge query failed: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to process knowledge request"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def user_login_ok(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})
    else:
        return Response({'message': 'Invalid username or password'}, status=401)
