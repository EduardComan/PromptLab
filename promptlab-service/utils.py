import os
import logging
import time
from typing import Dict, List, Any, Tuple, Optional
import tiktoken

logger = logging.getLogger(__name__)

def count_tokens(text: str, model: str = "gpt-3.5-turbo") -> int:
    """Count the number of tokens in the text using tiktoken"""
    try:
        # Get the appropriate encoding for the model
        encoding = tiktoken.encoding_for_model(model)
        # Count tokens
        tokens = encoding.encode(text)
        return len(tokens)
    except Exception as e:
        logger.warning(f"Error counting tokens with tiktoken: {str(e)}")
        # Fallback to approximate count
        return len(text.split())

def validate_parameters(model_id: str, parameters: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate the parameters for a model"""
    # Common parameter validators
    validators = {
        "temperature": lambda v: 0 <= v <= 2,
        "max_tokens": lambda v: 1 <= v <= 4096,
        "top_p": lambda v: 0 <= v <= 1,
        "frequency_penalty": lambda v: -2 <= v <= 2,
        "presence_penalty": lambda v: -2 <= v <= 2,
    }
    
    for param, value in parameters.items():
        # Skip unknown parameters
        if param not in validators:
            continue
            
        # Validate parameter
        validator = validators[param]
        if not validator(value):
            return False, f"Invalid value for parameter '{param}': {value}"
    
    return True, None

def format_duration(milliseconds: int) -> str:
    """Format a duration in milliseconds to a human-readable string"""
    if milliseconds < 1000:
        return f"{milliseconds}ms"
    elif milliseconds < 60000:
        return f"{milliseconds / 1000:.1f}s"
    else:
        minutes = milliseconds // 60000
        seconds = (milliseconds % 60000) / 1000
        return f"{minutes}m {seconds:.1f}s"

def sanitize_model_name(model_name: str) -> str:
    """Sanitize a model name to be used in file paths"""
    return model_name.replace("/", "_").replace(":", "_")

def get_cache_path(model_id: str) -> str:
    """Get the cache path for a model"""
    cache_dir = os.path.join(os.getcwd(), "model_cache")
    os.makedirs(cache_dir, exist_ok=True)
    return os.path.join(cache_dir, sanitize_model_name(model_id))

def create_error_response(error_message: str, status_code: int = 400) -> Tuple[Dict[str, Any], int]:
    """Create an error response for the API"""
    return {
        "status": "error",
        "error": error_message
    }, status_code 