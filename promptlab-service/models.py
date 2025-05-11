import os
import time
import logging
import importlib
from typing import Dict, List, Any, Tuple, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model registry to store all available models
model_registry = {}

class BaseModel:
    """Base class for all LLM models"""
    
    def __init__(self, model_id: str):
        self.model_id = model_id
        
    def generate(self, prompt: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate text from a prompt"""
        raise NotImplementedError("Subclasses must implement this method")
    
    def chat(self, messages: List[Dict[str, str]], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a response to a conversation"""
        raise NotImplementedError("Subclasses must implement this method")
    
    def get_default_parameters(self) -> Dict[str, Any]:
        """Get default parameters for the model"""
        return {
            "temperature": 0.7,
            "max_tokens": 1024,
            "top_p": 1.0,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }

# Import all model implementations
def load_models():
    """Dynamically load all model implementations"""
    try:
        # Import all models from the models directory
        import models
        
        # Register Llama models
        from models.llama import LlamaModel
        model_registry["llama-3-8b"] = LlamaModel("llama-3-8b")
        model_registry["llama-2-7b"] = LlamaModel("llama-2-7b")
        model_registry["llama-2-13b"] = LlamaModel("llama-2-13b")
        model_registry["llama-2-70b"] = LlamaModel("llama-2-70b")
        
        # Register Mistral models
        from models.mistral import MistralModel
        model_registry["mistral-7b"] = MistralModel("mistral-7b")
        model_registry["mistral-large"] = MistralModel("mistral-large")
        
        # Register OpenAI compatibles (through ollama/local deployment)
        from models.openai_compatible import OpenAICompatibleModel
        model_registry["orca-mini"] = OpenAICompatibleModel("orca-mini")
        model_registry["phi-3-mini"] = OpenAICompatibleModel("phi-3-mini")
        model_registry["gemma-7b"] = OpenAICompatibleModel("gemma-7b")
        
        # Register tiny models for prompt optimization
        from models.tiny_llm import TinyLLMModel
        model_registry["tinyllama"] = TinyLLMModel("tinyllama")
        model_registry["phi2"] = TinyLLMModel("phi2")
        model_registry["stablelm-zephyr"] = TinyLLMModel("stablelm-zephyr")
        model_registry["flan-t5-small"] = TinyLLMModel("flan-t5-small")
        
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")

# Call the load_models function to register all models
load_models()

def available_models() -> List[Dict[str, Any]]:
    """Get a list of available models with their metadata"""
    models_info = []
    
    for model_id, model in model_registry.items():
        try:
            model_info = {
                "id": model_id,
                "name": model_id.replace("-", " ").title(),
                "default_parameters": model.get_default_parameters(),
                "provider": model.__class__.__name__.replace("Model", ""),
                "size_category": "small" if "tiny" in model_id or "phi2" in model_id or "t5-small" in model_id else "medium"
            }
            models_info.append(model_info)
        except Exception as e:
            logger.error(f"Error getting model info for {model_id}: {str(e)}")
    
    return models_info

def get_model(model_id: str) -> Optional[BaseModel]:
    """Get a model by ID"""
    return model_registry.get(model_id) 