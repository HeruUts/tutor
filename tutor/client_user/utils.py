# Helper functions would be defined below or imported from another file

from .models import User
from .models import User, UserAchievement, InteractionHistory
from django.db.models import Q
import logging
import requests

logger = logging.getLogger(__name__)


def summarize_with_llama2(prompt):
    url = "http://localhost:11434/api/generate"  # Ollama endpoint
    data = {
        "model": "llama2",
        "prompt": prompt,
        "stream": False  # Set to True if you want streamed output
    }
    response = requests.post(url, json=data)
    return response.json()['response']


def get_knowledge_base_summary(query: str) -> str:
    """
    Core knowledge retrieval from your domain data sources
    Args:
        query: User's search query
    Returns:
        str: Generated summary (empty string if no results)
    """
    try:
        # Example implementation - replace with your actual knowledge base logic
        from .knowledge_sources import get_wikipedia_summary, search_internal_docs
        
        # Try Wikipedia first
        wiki_summary = get_wikipedia_summary(query)
        if wiki_summary:
            return wiki_summary[:500]  # Limit length
            
        # Fall back to internal docs
        internal_results = search_internal_docs(query)
        if internal_results:
            return "\n".join([f"- {res['title']}: {res['excerpt']}" 
                           for res in internal_results[:3]])
            
        return "No information found"
        
    except Exception as e:
        logger.error(f"Knowledge base query failed: {str(e)}", exc_info=True)
        return "Temporary knowledge service unavailable"

def filter_for_user(base_data: dict, user: User) -> dict:
    """
    Filters and ranks data based on user's profile and history
    Args:
        base_data: Raw system knowledge data
        user: Authenticated user instance
    Returns:
        dict: Filtered and prioritized results
    """
    try:
        user_prefs = user.persona_data.get('preferences', {})
        user_level = user.persona_data.get('knowledge_level', 'beginner')
        
        # 1. Filter by user preferences if specified
        if 'preferred_sources' in user_prefs:
            base_data['results'] = [
                item for item in base_data.get('results', [])
                if item['source'] in user_prefs['preferred_sources']
            ]
        
        # 2. Adjust complexity based on user level
        complexity_map = {
            'beginner': 1,
            'intermediate': 2,
            'advanced': 3
        }
        target_level = complexity_map.get(user_level, 1)
        
        for item in base_data.get('results', []):
            item_score = 0
            # Downrank items too complex for user
            if item.get('complexity', 1) > target_level:
                item_score -= 2
            # Boost items matching user interests
            if any(tag in user_prefs.get('interests', []) 
                  for tag in item.get('tags', [])):
                item_score += 1
            item['relevance_score'] = item.get('relevance_score', 0) + item_score
        
        # Sort by modified relevance score
        base_data['results'].sort(key=lambda x: x['relevance_score'], reverse=True)
        
        return base_data
        
    except Exception as e:
        logger.error(f"User filtering failed: {str(e)}", exc_info=True)
        return base_data  # Return unfiltered on failure

def get_system_data(query: str) -> dict:
    """
    Retrieves structured knowledge data from all available systems
    Args:
        query: Search query
    Returns:
        dict: Structured results from integrated systems
        Example: {
            "results": [
                {
                    "title": "...",
                    "content": "...", 
                    "source": "internal_db",
                    "tags": ["..."],
                    "complexity": 1-3
                }
            ]
        }
    """
    try:
        from .integrations import (
            search_sharepoint,
            query_salesforce_knowledge,
            get_azure_search_results
        )
        
        # Parallelize these calls in production using threading/celery
        sources = [
            search_sharepoint(query),
            query_salesforce_knowledge(query),
            get_azure_search_results(query)
        ]
        
        # Combine and deduplicate results
        combined = []
        seen_urls = set()
        
        for source in sources:
            for item in source.get('results', []):
                if item['url'] not in seen_urls:
                    combined.append(item)
                    seen_urls.add(item['url'])
        
        return {
            "query": query,
            "results": combined[:20],  # Limit to top 20
            "sources_queried": [s['source'] for s in sources]
        }
        
    except Exception as e:
        logger.error(f"System data query failed: {str(e)}", exc_info=True)
        return {
            "query": query,
            "results": [],
            "error": "Failed to query some knowledge sources"
        }

def get_personalized_knowledge_summary(query: str, user: User) -> str:
    """Add user-specific context to knowledge results"""
    base_summary = get_knowledge_base_summary(query)  # Your existing function
    return f"{base_summary} (Personalized for {user.username}'s preferences)"
    
def get_relevant_user_data(query: str, user: User) -> dict:
    """Filter data based on user's history and achievements"""
    base_data = get_system_data(query)  # Your existing function
    return {
        **base_data,
        "user_relevant": filter_for_user(base_data, user)
    }