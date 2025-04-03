import os
import logging
import time
import requests
import json
from typing import Dict, List, Any, Optional

from ..models import BaseModel

logger = logging.getLogger(__name__)

class OpenAICompatibleModel(BaseModel):
    """Implementation of OpenAI compatible API models (e.g., Ollama, local models)"""
    
    # Map model IDs to actual Ollama model names
    MODEL_MAP = {
        "orca-mini": "orca-mini",
        "phi-3-mini": "phi3",
        "gemma-7b": "gemma:7b",
    }
    
    def __init__(self, model_id: str):
        super().__init__(model_id)
        
        self.ollama_model = self.MODEL_MAP.get(model_id)
        if not self.ollama_model:
            raise ValueError(f"Unknown model ID: {model_id}")
        
        self.api_base = os.getenv("OLLAMA_API_BASE", "http://localhost:11434/api")
        logger.info(f"Initializing {model_id} using Ollama API at {self.api_base}")

    def generate(self, prompt: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate text from a prompt using Ollama API"""
        try:
            # Apply parameter defaults if not provided
            defaults = self.get_default_parameters()
            for key, value in defaults.items():
                if key not in parameters:
                    parameters[key] = value
            
            # Start timing
            log_entries = [{"type": "info", "message": f"Starting generation with {self.model_id}"}]
            start_time = time.time()
            
            # Prepare request
            api_url = f"{self.api_base}/generate"
            payload = {
                "model": self.ollama_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": parameters.get("temperature", 0.7),
                    "top_p": parameters.get("top_p", 0.9),
                    "top_k": 40,
                    "num_predict": parameters.get("max_tokens", 1024),
                }
            }
            
            # Add stop sequences if provided
            if "stop" in parameters:
                payload["options"]["stop"] = parameters["stop"]
            
            # Make API request
            response = requests.post(api_url, json=payload, timeout=120)
            response.raise_for_status()
            
            # Process response
            result = response.json()
            
            # Calculate metrics
            end_time = time.time()
            duration = end_time - start_time
            log_entries.append({
                "type": "info", 
                "message": f"Generation completed in {duration:.2f} seconds"
            })
            
            # Get token counts from response if available
            tokens_input = result.get("prompt_eval_count", 0)
            tokens_output = result.get("eval_count", 0)
            
            return {
                "output": result.get("response", ""),
                "tokens_input": tokens_input,
                "tokens_output": tokens_output,
                "log": log_entries
            }
            
        except Exception as e:
            logger.exception(f"Error generating text with {self.model_id}: {str(e)}")
            return {
                "output": f"Error: {str(e)}",
                "tokens_input": 0,
                "tokens_output": 0,
                "log": [{"type": "error", "message": str(e)}]
            }
    
    def chat(self, messages: List[Dict[str, str]], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a chat response using Ollama API"""
        try:
            # Apply parameter defaults if not provided
            defaults = self.get_default_parameters()
            for key, value in defaults.items():
                if key not in parameters:
                    parameters[key] = value
            
            # Start timing
            log_entries = [{"type": "info", "message": f"Starting chat with {self.model_id}"}]
            start_time = time.time()
            
            # Prepare request
            api_url = f"{self.api_base}/chat"
            payload = {
                "model": self.ollama_model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": parameters.get("temperature", 0.7),
                    "top_p": parameters.get("top_p", 0.9),
                    "top_k": 40,
                    "num_predict": parameters.get("max_tokens", 1024),
                }
            }
            
            # Add stop sequences if provided
            if "stop" in parameters:
                payload["options"]["stop"] = parameters["stop"]
            
            # Make API request
            response = requests.post(api_url, json=payload, timeout=120)
            response.raise_for_status()
            
            # Process response
            result = response.json()
            
            # Calculate metrics
            end_time = time.time()
            duration = end_time - start_time
            log_entries.append({
                "type": "info", 
                "message": f"Chat completed in {duration:.2f} seconds"
            })
            
            # Get token counts from response if available
            tokens_input = result.get("prompt_eval_count", 0)
            tokens_output = result.get("eval_count", 0)
            
            # Extract the response from the message
            output = ""
            if "message" in result:
                output = result["message"].get("content", "")
            
            return {
                "output": output,
                "tokens_input": tokens_input,
                "tokens_output": tokens_output,
                "log": log_entries
            }
            
        except Exception as e:
            logger.exception(f"Error in chat with {self.model_id}: {str(e)}")
            return {
                "output": f"Error: {str(e)}",
                "tokens_input": 0,
                "tokens_output": 0,
                "log": [{"type": "error", "message": str(e)}]
            }
    
    def get_default_parameters(self) -> Dict[str, Any]:
        """Get default parameters for the model"""
        return {
            "temperature": 0.7,
            "max_tokens": 1024,
            "top_p": 0.9,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        } 