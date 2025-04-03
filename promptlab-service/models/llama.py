import os
import logging
import time
from typing import Dict, List, Any, Optional
import torch
from huggingface_hub import snapshot_download
from transformers import AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer
from threading import Thread

from ..models import BaseModel

logger = logging.getLogger(__name__)

class LlamaModel(BaseModel):
    """Implementation of Llama models using Hugging Face"""
    
    MODEL_MAP = {
        "llama-3-8b": "meta-llama/Llama-3-8B",
        "llama-2-7b": "meta-llama/Llama-2-7b-hf",
        "llama-2-13b": "meta-llama/Llama-2-13b-hf",
        "llama-2-70b": "meta-llama/Llama-2-70b-hf",
    }
    
    def __init__(self, model_id: str):
        super().__init__(model_id)
        
        self.hf_model_id = self.MODEL_MAP.get(model_id)
        if not self.hf_model_id:
            raise ValueError(f"Unknown model ID: {model_id}")
        
        self.tokenizer = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Use 4-bit quantization if on CPU to reduce memory usage
        self.load_in_8bit = self.device == "cuda"
        
        logger.info(f"Initializing {model_id} on {self.device}")
    
    def _ensure_model_loaded(self):
        """Ensure the model is loaded"""
        if self.model is None:
            try:
                logger.info(f"Loading {self.model_id} from {self.hf_model_id}")
                
                # Download model locally to avoid re-downloading
                cache_dir = os.path.join(os.getcwd(), "model_cache", self.model_id)
                os.makedirs(cache_dir, exist_ok=True)
                
                # Load tokenizer
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.hf_model_id,
                    cache_dir=cache_dir,
                    padding_side="left"
                )
                
                # Load model with appropriate quantization
                quantization_config = None
                if not self.load_in_8bit:
                    # Use 4-bit quantization on CPU
                    from transformers import BitsAndBytesConfig
                    quantization_config = BitsAndBytesConfig(
                        load_in_4bit=True,
                        bnb_4bit_compute_dtype=torch.float16
                    )
                
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.hf_model_id,
                    cache_dir=cache_dir,
                    load_in_8bit=self.load_in_8bit,
                    quantization_config=quantization_config,
                    torch_dtype=torch.float16,
                    device_map="auto"
                )
                
                logger.info(f"Successfully loaded {self.model_id}")
            except Exception as e:
                logger.error(f"Error loading model {self.model_id}: {str(e)}")
                raise
    
    def generate(self, prompt: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate text from a prompt"""
        try:
            self._ensure_model_loaded()
            
            # Apply parameter defaults if not provided
            defaults = self.get_default_parameters()
            for key, value in defaults.items():
                if key not in parameters:
                    parameters[key] = value
            
            # Prepare input
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
            input_tokens = inputs.input_ids.shape[1]
            
            # Log generation start
            log_entries = [{"type": "info", "message": f"Starting generation with {self.model_id}"}]
            start_time = time.time()
            
            # Generate
            generation_args = {
                "input_ids": inputs.input_ids,
                "attention_mask": inputs.attention_mask,
                "max_new_tokens": parameters.get("max_tokens", 1024),
                "temperature": parameters.get("temperature", 0.7),
                "top_p": parameters.get("top_p", 1.0),
                "do_sample": parameters.get("temperature", 0.7) > 0.0,
                "repetition_penalty": 1.0 + parameters.get("frequency_penalty", 0.0),
            }
            
            # Optional parameters
            if "stop" in parameters:
                generation_args["stopping_criteria"] = self._create_stopping_criteria(parameters["stop"])
            
            generation_output = self.model.generate(**generation_args)
            
            # Decode output
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
            self._ensure_model_loaded()
            
            # Apply parameter defaults if not provided
            defaults = self.get_default_parameters()
            for key, value in defaults.items():
                if key not in parameters:
                    parameters[key] = value
            
            # Format messages for Llama models
            formatted_prompt = self._format_chat_prompt(messages)
            
            # Generate response using the formatted prompt
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
        """Format chat messages for Llama models"""
        formatted_messages = []
        
        for message in messages:
            role = message["role"].lower()
            content = message["content"]
            
            if role == "system":
                formatted_messages.append(f"<|system|>\n{content}")
            elif role == "user":
                formatted_messages.append(f"<|user|>\n{content}")
            elif role == "assistant":
                formatted_messages.append(f"<|assistant|>\n{content}")
            else:
                # Handle other roles as user
                formatted_messages.append(f"<|user|>\n{content}")
        
        # Add the assistant prefix for the response
        formatted_messages.append("<|assistant|>")
        
        return "\n".join(formatted_messages)
    
    def _create_stopping_criteria(self, stop_sequences: List[str]):
        """Create stopping criteria based on stop sequences"""
        from transformers import StoppingCriteria, StoppingCriteriaList
        
        class StopSequenceCriteria(StoppingCriteria):
            def __init__(self, tokenizer, stop_sequences, input_length):
                self.tokenizer = tokenizer
                self.stop_sequences = stop_sequences
                self.input_length = input_length
                
            def __call__(self, input_ids, scores, **kwargs):
                generated_text = self.tokenizer.decode(
                    input_ids[0][self.input_length:], 
                    skip_special_tokens=False
                )
                return any(stop_seq in generated_text for stop_seq in self.stop_sequences)
        
        input_length = 0  # Will be set in generate()
        criteria = StopSequenceCriteria(self.tokenizer, stop_sequences, input_length)
        return StoppingCriteriaList([criteria])
    
    def get_default_parameters(self) -> Dict[str, Any]:
        """Get default parameters for the model"""
        return {
            "temperature": 0.7,
            "max_tokens": 1024,
            "top_p": 0.9,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        } 