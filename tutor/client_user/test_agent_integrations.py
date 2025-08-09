import sys
import os
import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch

# Calculate the correct path to agent module
current_dir = os.path.dirname(os.path.abspath(__file__))
agent_dir = os.path.join(os.path.dirname(os.path.dirname(current_dir)), "agent")
sys.path.insert(0, agent_dir)  # Add agent directory to Python path

# Now imports should work
from connector import DjangoKnowledgeConnector, EnhancedMultimodalAgent
from livekit import rtc

# Test Configuration
DJANGO_URL = "http://localhost:8000"
TEST_TOKEN = "your-test-token-here"

@pytest.fixture
def mock_ctx():
    """Create a mock LiveKit context"""
    ctx = MagicMock()
    ctx.room = AsyncMock()
    ctx.room.name = "test_room"
    
    participant = MagicMock()
    participant.identity = "test_user"
    participant.metadata = json.dumps({
        "openai_api_key": "test_key",
        "instructions": "Test instructions",
        "voice": "alloy"
    })
    ctx.wait_for_participant.return_value = participant
    
    return ctx

@pytest.mark.asyncio
async def test_agent_initialization(mock_ctx):
    """Test agent can initialize with Django connection"""
    with patch('connector.requests.get') as mock_get:
        # Setup mock Django response
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "summary": "Test response",
            "user_context": {}
        }
        
        # Initialize agent
        django_conn = DjangoKnowledgeConnector(DJANGO_URL)
        agent = EnhancedMultimodalAgent(django_conn)
        
        # Verify agent created
        assert agent is not None
        assert agent.django_connector is django_conn

if __name__ == "__main__":
    pytest.main(["-v", __file__])