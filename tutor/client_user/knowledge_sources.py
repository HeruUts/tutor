# django_app/knowledge_sources.py
import requests
import logging
from django.conf import settings
from typing import List, Dict, Optional
from urllib.parse import quote
import time

logger = logging.getLogger(__name__)

# Cache structure for internal docs
_internal_docs_cache = {
    'last_updated': 0,
    'docs': []
}

def get_wikipedia_summary(query: str, lang: str = "en") -> Optional[str]:
    """
    Fetches a summary from Wikipedia's API
    Args:
        query: Search term
        lang: Language code (default 'en')
    Returns:
        str|None: Extracted summary or None if not found
    """
    try:
        # Wikipedia API endpoint
        url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{quote(query)}"
        
        response = requests.get(
            url,
            headers={"User-Agent": f"{settings.APP_NAME}/1.0"},
            timeout=2  # Fail fast
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get('extract')
            
        # Handle disambiguation pages
        if response.status_code == 404 and 'may refer to' in response.text:
            return f"Multiple topics match '{query}'. Please be more specific."
            
        return None
        
    except requests.exceptions.RequestException as e:
        logger.warning(f"Wikipedia query failed: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected Wikipedia error: {str(e)}", exc_info=True)
        return None

def search_internal_docs(query: str, refresh_cache: bool = False) -> List[Dict]:
    """
    Searches internal documentation systems
    Args:
        query: Search term
        refresh_cache: Force cache refresh
    Returns:
        list: Matching documents with title, excerpt, and metadata
    """
    try:
        # Check cache first (refresh every 15 minutes)
        if not refresh_cache and time.time() - _internal_docs_cache['last_updated'] < 900:
            docs = _internal_docs_cache['docs']
        else:
            docs = _fetch_all_internal_docs()
            _internal_docs_cache.update({
                'docs': docs,
                'last_updated': time.time()
            })
        
        # Simple case-insensitive search (replace with proper search backend)
        query_lower = query.lower()
        results = []
        
        for doc in docs:
            # Basic relevance scoring
            score = 0
            if query_lower in doc['title'].lower():
                score += 3
            if query_lower in doc['content'].lower():
                score += 1
            if any(query_lower in tag.lower() for tag in doc.get('tags', [])):
                score += 2
                
            if score > 0:
                # Generate excerpt
                content = doc['content']
                pos = content.lower().find(query_lower)
                excerpt_start = max(0, pos - 50)
                excerpt_end = min(len(content), pos + len(query) + 50)
                excerpt = (
                    ("..." if excerpt_start > 0 else "") +
                    content[excerpt_start:excerpt_end] +
                    ("..." if excerpt_end < len(content) else "")
                )
                
                results.append({
                    'title': doc['title'],
                    'excerpt': excerpt,
                    'score': score,
                    'source': doc['source'],
                    'url': doc['url'],
                    'last_updated': doc.get('updated_at', '')
                })
        
        # Sort by relevance
        return sorted(results, key=lambda x: x['score'], reverse=True)[:10]
        
    except Exception as e:
        logger.error(f"Internal docs search failed: {str(e)}", exc_info=True)
        return []

def _fetch_all_internal_docs() -> List[Dict]:
    """
    Fetches documents from all configured internal sources
    Returns:
        list: Combined documents from all sources
    """
    sources = []
    
    # Example source 1: Confluence
    if hasattr(settings, 'CONFLUENCE_API_URL'):
        try:
            confluence_docs = _get_confluence_docs()
            sources.extend(confluence_docs)
        except Exception as e:
            logger.error(f"Confluence fetch failed: {str(e)}")
    
    # Example source 2: Google Drive
    if hasattr(settings, 'GOOGLE_DRIVE_FOLDER_ID'):
        try:
            drive_docs = _get_google_drive_docs()
            sources.extend(drive_drive_docs)
        except Exception as e:
            logger.error(f"Google Drive fetch failed: {str(e)}")
    
    # Add more sources as needed
    return sources

# Example source-specific functions (implement according to your needs)
def _get_confluence_docs() -> List[Dict]:
    """Fetch documents from Confluence API"""
    # Implementation example:
    # response = requests.get(
    #     f"{settings.CONFLUENCE_API_URL}/rest/api/content/search",
    #     params={'cql': 'type=page'},
    #     auth=(settings.CONFLUENCE_USER, settings.CONFLUENCE_API_KEY)
    # )
    # ... parse response ...
    return []  # Return actual docs in your implementation

def _get_google_drive_docs() -> List[Dict]:
    """Fetch documents from Google Drive API"""
    # Implementation would use Google Drive API
    return []