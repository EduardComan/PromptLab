import os
import logging
import time
from typing import Dict, List, Any, Optional
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

from ..models import BaseModel

logger = logging.getLogger(__name__)

class TinyLLMModel(BaseModel):
    """
    Implementation of tiny/small models optimized for prompt critiquing and enhancement.
    These models are chosen for their small size and ability to run on modest hardware.
    """
    
    MODEL_MAP = {
        "tinyllama": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        "phi2": "microsoft/phi-2",
        "stablelm-zephyr": "stabilityai/stablelm-zephyr-3b",
        "flan-t5-small": "google/flan-t5-small",
    }
    
    def __init__(self, model_id: str):
        super().__init__(model_id)
        
        self.hf_model_id = self.MODEL_MAP.get(model_id)
        if not self.hf_model_id:
            raise ValueError(f"Unknown model ID: {model_id}")
        
        self.tokenizer = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        logger.info(f"Initializing {model_id} on {self.device}")
        
        # Flag for T5 models which use a different generation API
        self.is_t5 = "t5" in self.hf_model_id.lower()
    
    def _ensure_model_loaded(self):
        """Ensure the model is loaded with maximum optimization for low resources"""
        if self.model is None:
            try:
                logger.info(f"Loading {self.model_id} from {self.hf_model_id}")
                
                # Create cache directory
                cache_dir = os.path.join(os.getcwd(), "model_cache", self.model_id)
                os.makedirs(cache_dir, exist_ok=True)
                
                # Load tokenizer
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.hf_model_id,
                    cache_dir=cache_dir
                )
                
                # Apply maximum quantization for efficiency
                from transformers import BitsAndBytesConfig
                quantization_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.float16,
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_quant_type="nf4"
                )
                
                # Load model with 4-bit quantization
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.hf_model_id,
                    cache_dir=cache_dir,
                    quantization_config=quantization_config,
                    torch_dtype=torch.float16,
                    device_map="auto",
                    low_cpu_mem_usage=True
                )
                
                logger.info(f"Successfully loaded {self.model_id}")
            except Exception as e:
                logger.error(f"Error loading model {self.model_id}: {str(e)}")
                raise
    
    def generate(self, prompt: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate text from a prompt"""
        try:
            self._ensure_model_loaded()
            
            # Apply parameter defaults
            defaults = self.get_default_parameters()
            for key, value in defaults.items():
                if key not in parameters:
                    parameters[key] = value
            
            # Prepare input
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
            input_tokens = inputs.input_ids.shape[1]
            
            # Start timing
            log_entries = [{"type": "info", "message": f"Starting generation with {self.model_id}"}]
            start_time = time.time()
            
            # Generate with different approach based on model type
            if self.is_t5:
                # T5 models use a different generation method
                outputs = self.model.generate(
                    input_ids=inputs.input_ids,
                    attention_mask=inputs.attention_mask,
                    max_length=input_tokens + parameters.get("max_tokens", 512),
                    temperature=parameters.get("temperature", 0.7),
                    top_p=parameters.get("top_p", 0.9),
                    do_sample=parameters.get("temperature", 0.7) > 0.0,
                    repetition_penalty=1.0 + parameters.get("frequency_penalty", 0.0),
                )
                output_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                output_tokens = outputs.shape[1]
            else:
                # Standard generation for autoregressive models
                generation_args = {
                    "input_ids": inputs.input_ids,
                    "attention_mask": inputs.attention_mask,
                    "max_new_tokens": parameters.get("max_tokens", 512),
                    "temperature": parameters.get("temperature", 0.7),
                    "top_p": parameters.get("top_p", 0.9),
                    "do_sample": parameters.get("temperature", 0.7) > 0.0,
                    "repetition_penalty": 1.0 + parameters.get("frequency_penalty", 0.0),
                }
                generation_output = self.model.generate(**generation_args)
                output_tokens = generation_output.shape[1]
                output_text = self.tokenizer.decode(
                    generation_output[0, inputs.input_ids.shape[1]:], 
                    skip_special_tokens=True
                )
            
            # Calculate metrics
            end_time = time.time()
            duration = end_time - start_time
            log_entries.append({
                "type": "info", 
                "message": f"Generation completed in {duration:.2f} seconds"
            })
            
            return {
                "output": output_text,
                "tokens_input": input_tokens,
                "tokens_output": output_tokens - input_tokens,
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
        """Generate a response to a conversation"""
        try:
            # Format chat as a single prompt
            formatted_prompt = self._format_chat_prompt(messages)
            
            # Generate using the formatted prompt
            return self.generate(formatted_prompt, parameters)
            
        except Exception as e:
            logger.exception(f"Error in chat with {self.model_id}: {str(e)}")
            return {
                "output": f"Error: {str(e)}",
                "tokens_input": 0,
                "tokens_output": 0,
                "log": [{"type": "error", "message": str(e)}]
            }
    
    def _format_chat_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Format chat messages based on model type"""
        if "tinyllama" in self.model_id:
            return self._format_tinyllama_chat(messages)
        elif "phi" in self.model_id:
            return self._format_phi_chat(messages)
        elif "stablelm" in self.model_id:
            return self._format_stablelm_chat(messages)
        elif "t5" in self.model_id:
            return self._format_t5_chat(messages)
        else:
            # Default formatting
            return self._format_simple_chat(messages)
    
    def _format_tinyllama_chat(self, messages: List[Dict[str, str]]) -> str:
        """Format for TinyLlama chat models"""
        formatted = []
        for msg in messages:
            role = msg["role"].lower()
            content = msg["content"]
            
            if role == "system":
                formatted.append(f"<|system|>\n{content}")
            elif role == "user":
                formatted.append(f"<|user|>\n{content}")
            elif role == "assistant":
                formatted.append(f"<|assistant|>\n{content}")
        
        formatted.append("<|assistant|>")
        return "\n".join(formatted)
    
    def _format_phi_chat(self, messages: List[Dict[str, str]]) -> str:
        """Format for Phi-2 chat"""
        formatted = []
        for i, msg in enumerate(messages):
            role = msg["role"].lower()
            content = msg["content"]
            
            if role == "system" and i == 0:
                # System at the beginning becomes instructions
                formatted.append(f"Instructions: {content}\n")
            elif role == "user":
                formatted.append(f"Human: {content}")
            elif role == "assistant":
                formatted.append(f"Assistant: {content}")
        
        formatted.append("Assistant:")
        return "\n".join(formatted)
    
    def _format_stablelm_chat(self, messages: List[Dict[str, str]]) -> str:
        """Format for StableLM Zephyr"""
        formatted = []
        system_msg = None
        
        # Extract system message if present
        for msg in messages:
            if msg["role"].lower() == "system":
                system_msg = msg["content"]
                break
        
        # Start with system if present
        if system_msg:
            formatted.append(f"<|system|>\n{system_msg}")
        
        # Add conversation
        for msg in messages:
            role = msg["role"].lower()
            if role == "system":
                continue  # Already handled
            
            content = msg["content"]
            if role == "user":
                formatted.append(f"<|user|>\n{content}")
            elif role == "assistant":
                formatted.append(f"<|assistant|>\n{content}")
        
        # Add final assistant prompt
        formatted.append("<|assistant|>")
        return "\n".join(formatted)
    
    def _format_t5_chat(self, messages: List[Dict[str, str]]) -> str:
        """Format for T5 models which expect a simple text prompt"""
        parts = []
        system_info = None
        
        # Extract system message
        for msg in messages:
            if msg["role"].lower() == "system":
                system_info = msg["content"]
                break
        
        # Start with system context if available
        if system_info:
            parts.append(f"System: {system_info}")
        
        # Add conversation history
        for msg in messages:
            role = msg["role"].lower()
            if role == "system":
                continue  # Already handled
            
            content = msg["content"]
            if role == "user":
                parts.append(f"User: {content}")
            elif role == "assistant":
                parts.append(f"Assistant: {content}")
        
        # Add prompt for response
        parts.append("Assistant:")
        return "\n".join(parts)
    
    def _format_simple_chat(self, messages: List[Dict[str, str]]) -> str:
        """Simple chat format for generic models"""
        formatted = []
        for msg in messages:
            role = msg["role"].capitalize()
            content = msg["content"]
            formatted.append(f"{role}: {content}")
        
        formatted.append("Assistant:")
        return "\n".join(formatted)
    
    def get_default_parameters(self) -> Dict[str, Any]:
        """Get default parameters for tiny models - more conservative to prevent errors"""
        return {
            "temperature": 0.7,
            "max_tokens": 512,  # Smaller token limit for tiny models
            "top_p": 0.9,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
    
    def critique_prompt(self, prompt: str, target: str = None) -> Dict[str, Any]:
        """
        Specialized function to critique and improve a prompt
        
        Args:
            prompt: The original prompt to critique
            target: Optional target/goal to guide the critique
        
        Returns:
            Dict with critique, improved prompt and metrics
        """
        critique_template = f"""
You are an expert at optimizing prompts for language models. Analyze this prompt and provide a critique:

ORIGINAL PROMPT:
{prompt}

{f"TARGET GOAL: {target}" if target else ""}

Your task:
1. Critique the prompt (what works, what doesn't, unclear instructions, etc.)
2. Suggest specific improvements 
3. Provide an improved version

Output your analysis in this format:
CRITIQUE: [your critique]
IMPROVEMENTS: [specific suggestions]
IMPROVED PROMPT: [rewritten prompt]
"""
        
        # Use low temperature for more consistent analysis
        parameters = {
            "temperature": 0.3,
            "max_tokens": 1024,
            "top_p": 0.9
        }
        
        # Generate the critique
        result = self.generate(critique_template, parameters)
        
        return result 