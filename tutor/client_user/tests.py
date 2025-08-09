# tests/test_entrypoint.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from livekit import rtc
from ...agent.connector import  DjangoKnowledgeConnector
from ...agent.main import entrypoint
import json
import os

@pytest.fixture
def mock_ctx():
    """Mock LiveKit JobContext"""
    ctx = MagicMock()
    ctx.room = AsyncMock()
    ctx.room.name = "test_room"
    ctx.room.remote_participants = {}
    
    # Mock participant
    participant = MagicMock()
    participant.identity = "test_user"
    participant.metadata = json.dumps({
        "openai_api_key": "test_key",
        "instructions": "Test instructions",
        "voice": "alloy"
    })
    ctx.wait_for_participant.return_value = participant
    
    return ctx

@pytest.fixture
def mock_django_response():
    """Mock Django API response"""
    return {
        "summary": "Test knowledge summary",
        "data": {"key": "value"},
        "user_context": {
            "preferences": {"lang": "en"},
            "recent_interactions": ["Hello", "Hi there"],
            "current_achievement": {"title": "Fast Learner"}
        }
    }

@pytest.mark.asyncio
async def test_entrypoint_with_django(mock_ctx, mock_django_response):
    """Test complete flow from entrypoint to Django integration"""
    with patch('requests.get') as mock_get, \
         patch('your_app.agent.MultimodalAgent') as mock_agent:
        
        # Mock Django API response
        mock_get.return_value.json.return_value = mock_django_response
        mock_get.return_value.status_code = 200
        
        # Mock agent components
        mock_agent_instance = mock_agent.return_value
        mock_agent_instance.process_audio = AsyncMock()
        mock_agent_instance.process_audio.return_value = "Test response"
        
        # Call entrypoint
        await entrypoint(mock_ctx)
        
        # Verify LiveKit connection
        mock_ctx.connect.assert_awaited_once_with(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
        
        # Verify Django API call
        expected_url = "http://your-django-app/api/user-context/test_user/"
        mock_get.assert_called_once_with(
            expected_url,
            headers={"Authorization": "Token YOUR_DJANGO_TOKEN"},
            params={"session_id": mock.ANY}  # session ID will be generated
        )
        
        # Verify agent processing
        mock_agent_instance.process_audio.assert_awaited_once()

@pytest.mark.asyncio
async def test_knowledge_connector(mock_django_response):
    """Test Django knowledge connector directly"""
    with patch('requests.get') as mock_get:
        mock_get.return_value.json.return_value = mock_django_response
        mock_get.return_value.status_code = 200
        
        connector = DjangoKnowledgeConnector("http://test-django")
        result = await connector.get_user_context("test_user", "session123")
        
        assert result == mock_django_response
        mock_get.assert_called_once_with(
            "http://test-django/api/user-context/test_user/",
            headers={"Authorization": "Token YOUR_DJANGO_TOKEN"},
            params={"session_id": "session123"}
        )

def test_config_parsing():
    """Test participant metadata parsing"""
    test_config = {
        "openai_api_key": "test_key",
        "instructions": "Be helpful",
        "voice": "shimmer",
        "temperature": "0.7",
        "max_output_tokens": "500",
        "modalities": "text_and_audio"
    }
    
    config = parse_session_config(test_config)
    
    assert config.openai_api_key == "test_key"
    assert config.instructions == "Be helpful"
    assert config.voice == "shimmer"
    assert config.temperature == 0.7
    assert config.max_response_output_tokens == 500
    assert config.modalities == ["text", "audio"]

@pytest.mark.asyncio
async def test_audio_processing_flow():
    """Test complete audio processing pipeline"""
    test_audio = rtc.AudioFrame(
        data=bytearray(16000),  # 1 second of silence
        sample_rate=16000,
        num_channels=1,
        samples_per_channel=16000
    )
    
    with patch('your_app.agent.DjangoKnowledgeConnector') as mock_connector, \
         patch('your_app.agent.OpenAIService') as mock_openai:
        
        # Setup mocks
        mock_connector.return_value.get_user_context.return_value = {
            "persona": {"prefs": {"lang": "en"}}
        }
        mock_openai.return_value.transcribe.return_value = "Test transcription"
        mock_openai.return_value.generate_response.return_value = "Test response"
        mock_openai.return_value.generate_audio.return_value = bytearray(16000)
        
        # Initialize agent
        agent = MultimodalAgent("http://django-test")
        await agent.process_audio(test_audio, "user123", "session456")
        
        # Verify calls
        mock_connector.return_value.get_user_context.assert_awaited_once_with(
            "user123", "session456"
        )
        mock_openai.return_value.transcribe.assert_awaited_once_with(test_audio)
        mock_openai.return_value.generate_response.assert_awaited_once_with(
            "Test transcription",
            mock.ANY  # Should include user context
        )

# Add this to test error cases
@pytest.mark.asyncio
async def test_django_api_failure():
    """Test Django API failure handling"""
    with patch('requests.get') as mock_get:
        mock_get.return_value.status_code = 500
        
        connector = DjangoKnowledgeConnector("http://test-django")
        with pytest.raises(Exception):
            await connector.get_user_context("test_user", "session123")