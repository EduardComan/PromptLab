import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import requests
import logging
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

load_dotenv()

# Set your Gemini API key as an environment variable or hardcode temporarily (not for production)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_API_KEY_HERE")

# Gemini 1.5 Flash endpoint
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# Available models
MODEL_REGISTRY = {
    "gemini-1.5-flash": {
        "name": "Gemini 1.5 Flash",
        "description": "Google's fast multimodal model with great performance for diverse tasks",
        "default_parameters": {
            "temperature": 0.7,
            "top_p": 1.0,
            "max_tokens": 128,
            "frequency_penalty": 0.0
        },
        "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        "provider": "Google",
        "capabilities": ["text-generation", "chat", "multimodal"],
        "cost": {
            "input_per_1k": 10.25,
            "output_per_1k": 30.75
        }
    },
    "gemini-0.5-flash": {
        "name": "Gemini 0.5 Flash",
        "description": "Google's fast multimodal model with great performance for diverse tasks",
        "default_parameters": {
            "temperature": 0.7,
            "top_p": 1.0,
            "max_tokens": 256,
            "frequency_penalty": 0.0
        },
        "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        "provider": "Google",
        "capabilities": ["text-generation", "chat", "multimodal"],
        "cost": {
            "input_per_1k": 0.000125,
            "output_per_1k": 0.000375
        }
    }
}

# Optimization Constants
OPTIMIZATION_CONFIG = {
    "DEFAULT_ITERATIONS": 2,
    "DEFAULT_CANDIDATES_PER_ROUND": 2,
    "DEFAULT_MAX_TOKENS": 500,
    "TOKEN_LIMITS": {
        "CANDIDATE_GENERATION": 400,  # Enough for improved prompt without bloating
        "EVALUATION": 150,            # Concise evaluation with score and reasoning
        "REFINEMENT": 450,           # Allow for thoughtful refinement
        "FINAL_EVALUATION": 200      # Comprehensive final assessment
    },
    "TEMPERATURE_SETTINGS": {
        "GENERATION": 0.7,           # Creative for generating variations
        "EVALUATION": 0.2,           # Low for consistent scoring
        "REFINEMENT": 0.4,           # Moderate for focused improvements
        "FINAL_EVALUATION": 0.2      # Low for objective assessment
    },
    "SCORE_RANGES": {
        "ITERATION_MIN": 0,
        "ITERATION_MAX": 40,
        "FINAL_MIN": 0,
        "FINAL_MAX": 10
    }
}

# Prompt Templates
PROMPT_TEMPLATES = {
    "QUALITY_INSTRUCTION": """
Focus on quality improvements, not length. Be concise and purposeful. Do not add unnecessary content just to fill token limits.
Ensure your response is clear, specific, and directly addresses the request.""",
    
    "CANDIDATE_GENERATION": """
You are an expert prompt engineer. Your task is to improve the given prompt.

Original prompt: {original_prompt}
Optimization instructions: {optimization_instructions}

Requirements:
1. Keep the core intent and functionality of the original prompt
2. Make it more specific, clear, and effective
3. Ensure the improved prompt will generate better, more consistent outputs
4. Do not make it unnecessarily long or complex
5. Focus on quality improvements, not length — the improved prompt itself should not exceed {token_limit} tokens
Generate an improved version of this prompt
Important: Do not include any explanations. Only output the improved prompt.""",

    "EVALUATION": """
You are an expert prompt evaluator. Evaluate how well this prompt will perform based on the criteria below.

Prompt A:
{base_prompt}

Prompt A Response:
{base_prompt_response}

Prompt B:
{candidate_prompt}

Prompt B Response:
{candidate_prompt_response}

Optimization goal: {optimization_instructions}

Evaluation criteria:
1. Clarity and specificity
2. Likelihood to produce consistent outputs
3. Effectiveness for the intended use case

Only output the winning prompt as: "WINNER: A" or "WINNER: B"
""",
    
    "REFINEMENT": """You are an expert prompt engineer. Take this already-good prompt and make subtle refinements to make it even better.

Current prompt: {current_prompt}

Optimization goal: {optimization_instructions}

Make small, targeted improvements such as:
- Better word choices
- Clearer instructions
- More specific guidance
- Better structure or formatting

Focus on quality over quantity. Do not unnecessarily expand the prompt.

Output only the refined prompt (no explanations):""",
    
    "FINAL_EVALUATION": """Reflect on the original prompt and the final improved prompt. Did the improvement meet the instructions below?

Original: {base_prompt}

Final: {final_prompt}

Instructions: {optimization_instructions}

Rate this improvement 0-10 and explain why. Be honest and objective.

Format:
SCORE: [number]
REASONING: [short explanation]"""
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'promptlab-service'})

"""List available models"""
@app.route('/models', methods=['GET'])
def list_models():
    return jsonify({
        "models": [
            { "id": model_id, **model }
            for model_id, model in MODEL_REGISTRY.items()
        ]
    })

"""
    Generate text using a selected LLM model.

    === INPUT ===
    JSON body:
    {
        "model": "gemini-1.5-flash",     # optional, defaults to "gemini-1.5-flash"
        "prompt": "string",              # required
        "parameters": {                  # optional
            "temperature": float,
            "top_p": float,
            "max_tokens": int,
            "frequency_penalty": float
        }
    }

    === OUTPUT ===
    Success (200):
    {
        "status": "success",
        "output": "Generated text...",
        "model": "gemini-1.5-flash",
        "metrics": {
            "processing_time_ms": int,
            "tokens_input": int,
            "tokens_output": int,
            "total_tokens": int,
            "cost_input": float,
            "cost_output": float,
            "cost_usd": float
        },
        "log": ["Generated with Gemini 1.5 Flash"]
    }

    Error (400 or 500):
    {
        "status": "error",
        "error": "Error message",
        "metrics": {
            "processing_time_ms": int
        }
    }
    """
@app.route("/generate", methods=["POST"])
def generate():
    start_time = time.time()

    try:
        data = request.json or {}
        model_id = data.get("model", "gemini-1.5-flash")

        # Lookup model config
        model = MODEL_REGISTRY.get(model_id)
        if not model:
            return jsonify({"error": f"Model '{model_id}' not supported"}), 400

        # Get prompt
        prompt = data.get("prompt")
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        # Add quality instruction to user prompt if requested
        add_quality_instruction = data.get("add_quality_instruction", False)
        if add_quality_instruction:
            prompt = prompt + PROMPT_TEMPLATES["QUALITY_INSTRUCTION"]

        # Merge default parameters with any user-specified overrides
        params = { **model["default_parameters"], **data.get("parameters", {}) }
        temperature = params["temperature"]
        top_p = params["top_p"]
        max_tokens = params["max_tokens"]
        frequency_penalty = params["frequency_penalty"]

        # Construct Gemini payload
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "topP": top_p,
                "maxOutputTokens": max_tokens,
                "frequencyPenalty": frequency_penalty
            }
        }

        headers = { "Content-Type": "application/json" }
        query_params = { "key": GEMINI_API_KEY }

        logger.info(f"Generating with model {model_id}")
        logger.info(f"Quality instruction added: {add_quality_instruction}")
        logger.info(f"Final prompt length: {len(prompt)} characters")
        response = requests.post(model["endpoint"], headers=headers, params=query_params, json=payload)
        response.raise_for_status()
        result = response.json()

        text = result["candidates"][0]["content"]["parts"][0]["text"]

        # Estimate metrics
        end_time = time.time()
        processing_time_ms = round((end_time - start_time) * 1000)
        # tokens_input = len(prompt.split()) * 1.3
        # tokens_output = len(text.split()) * 1.3

        tokens_input = len(prompt.split())
        tokens_output = len(text.split())

        cost_input = (tokens_input / 1000) * model["cost"]["input_per_1k"]
        cost_output = (tokens_output / 1000) * model["cost"]["output_per_1k"]
        total_cost = cost_input + cost_output
        
        # Debug logging for cost calculation
        logger.info(f"Cost calculation: tokens_input={tokens_input}, tokens_output={tokens_output}")
        logger.info(f"Cost rates: input_per_1k={model['cost']['input_per_1k']}, output_per_1k={model['cost']['output_per_1k']}")
        logger.info(f"Calculated costs: input=${cost_input:.6f}, output=${cost_output:.6f}, total=${total_cost:.6f}")

        return jsonify({
            "status": "success",
            "output": text,
            "model": model_id,
            "metrics": {
                "processing_time_ms": processing_time_ms,
                "tokens_input": int(tokens_input),
                "tokens_output": int(tokens_output),
                "total_tokens": int(tokens_input + tokens_output),
                "cost_input": round(cost_input, 6),
                "cost_output": round(cost_output, 6),
                "cost_usd": round(total_cost, 6)
            },
            "log": [f"Generated with {model['name']}", f"Quality instruction added: {add_quality_instruction}"]
        })

    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        return jsonify({
            "status": "error",
            "error": f"Gemini API error: {str(e)}",
            "metrics": {
                "processing_time_ms": round((time.time() - start_time) * 1000)
            }
        }), 500

    except Exception as e:
        logger.error(f"Error generating text: {str(e)}")
        return jsonify({
            "status": "error",
            "error": str(e),
            "metrics": {
                "processing_time_ms": round((time.time() - start_time) * 1000)
            }
        }), 500

def call_llm(prompt_text, temp, tokens, stage_name):
            """Helper function to call the LLM with specified parameters and logging"""
            logger.info(f"Calling LLM for {stage_name} (temp={temp}, max_tokens={tokens})")
            logger.info(f"{stage_name} prompt: '{prompt_text[:200]}{'...' if len(prompt_text) > 200 else ''}'")
            
            headers = { "Content-Type": "application/json" }
            query_params = { "key": GEMINI_API_KEY }
            payload = {
                "contents": [{"parts": [{"text": prompt_text}]}],
                "generationConfig": {
                    "temperature": temp,
                    "topP": 1.0,
                    "maxOutputTokens": min(tokens, 2048)  # Cap at model limit
                }
            }
            
            response = requests.post(MODEL_REGISTRY.get("gemini-1.5-flash")["endpoint"], headers=headers, params=query_params, json=payload)
            response.raise_for_status()
            result = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            
            logger.info(f"{stage_name} response: '{result[:200]}{'...' if len(result) > 200 else ''}'")
            logger.info(f"{stage_name} response length: {len(result)} characters")
            return result

@app.route('/optimize-prompt', methods=['POST'])
def optimize_prompt():
    """Generate chat response using Gemini API"""
    start_time = time.time()
    optimization_id = f"opt_{int(start_time)}"
    
    try:
        data = request.json

        if not data or 'prompt' not in data:
            logger.error(f"[{optimization_id}] Missing required 'prompt' field")
            return jsonify({'error': 'Prompt is required'}), 400

        optimization_instructions = data.get('instructions', 'Make this prompt more clear, specific, and effective')
        model_id = data.get('model', 'gemini-1.5-flash')
        
        # Get optimization parameters with fallbacks to constants
        temperature = data.get('temperature', OPTIMIZATION_CONFIG['TEMPERATURE_SETTINGS']['GENERATION'])
        max_tokens = data.get('max_tokens', OPTIMIZATION_CONFIG['DEFAULT_MAX_TOKENS'])
        
        # Use constants for optimization configuration
        iterations = OPTIMIZATION_CONFIG['DEFAULT_ITERATIONS']
        candidates_per_round = OPTIMIZATION_CONFIG['DEFAULT_CANDIDATES_PER_ROUND']

        # Lookup model config
        model = MODEL_REGISTRY.get(model_id)
        if not model:
            logger.error(f"[{optimization_id}] Unsupported model: {model_id}")
            return jsonify({"error": f"Model '{model_id}' not supported"}), 400
        
        base_prompt_reponse = call_llm(
                    data['prompt'], 
                    temperature,
                    max_tokens,
                    f"Generate a base prompt response"
                )

        best_prompt = {
            "prompt": data['prompt'],
            "response": base_prompt_reponse
        }

        logger.info("=" * 50)
        logger.info(f"[{optimization_id}] Starting optimization with {iterations} iterations, {candidates_per_round} candidates per round")
        logger.info(f"[{optimization_id}] Model: {model_id}, Temperature: {temperature}, Max tokens: {max_tokens}")
        logger.info(f"[{optimization_id}] Original prompt: '{best_prompt['prompt']}'")
        logger.info(f"[{optimization_id}] Original prompt length: {len(best_prompt['prompt'])} characters")
        logger.info(f"[{optimization_id}] Optimization instructions: '{optimization_instructions}'")

        headers = { "Content-Type": "application/json" }
        query_params = { "key": GEMINI_API_KEY }

        for iteration in range(iterations):
            candidates = []
            logger.info(f"[{optimization_id}] Iteration {iteration + 1} of {iterations}")

            for i in range(candidates_per_round):
                prompt_text = PROMPT_TEMPLATES["CANDIDATE_GENERATION"].format(
                    original_prompt=best_prompt['prompt'],
                    optimization_instructions=optimization_instructions,
                    token_limit=max_tokens
                )
                
                candidate = call_llm(
                    prompt_text, 
                    temperature,
                    max_tokens,
                    f"candidate_generation_iter{iteration + 1}_cand{i + 1}"
                )
                candidate_response = call_llm(
                    candidate, 
                    temperature,
                    max_tokens,
                    f"candidate_response_iter{iteration + 1}_cand{i + 1}"
                )

                candidates.append({"prompt": candidate, "response": candidate_response})
                
            for i, cand in enumerate(candidates):
                logger.info(f"[{optimization_id}] Candidate {i+1}: Prompt='{cand['prompt'][:80]}...', Response='{cand['response'][:80]}...'")

            # Step 2: Evaluate candidates
            for i, candidate in enumerate(candidates):
                evaluation = call_llm(
                    PROMPT_TEMPLATES["EVALUATION"].format(
                        base_prompt=best_prompt['prompt'],
                        base_prompt_response=best_prompt['response'],
                        candidate_prompt=candidate['prompt'],
                        candidate_prompt_response=candidate['response'],
                        optimization_instructions=optimization_instructions
                    ),
                    temperature,
                    max_tokens,
                    f"candidate_evaluation_iteration{iteration + 1} -> candidate{i + 1}"
                )
                
                logger.info(f"[{optimization_id}] {f"Evaluation{i}"}: '{evaluation}'")
                winner = "A" if "WINNER: A" in evaluation else "B" if "WINNER: B" in evaluation else "A"
                if winner == "A":
                    logger.info(f"[{optimization_id}] Winner is base prompt")
                elif winner == "B":
                    logger.info(f"[{optimization_id}] Winner is candidate {i}, updating best prompt. Now best prompt is: {candidate}")
                    best_prompt = {
                        "prompt": candidate['prompt'],
                        "response": candidate['response']
                    }   
                else:
                    logger.info(f"[{optimization_id}] WARNING: No winner found in evaluation: '{evaluation}'")

        end_time = time.time()
        processing_time_ms = round((end_time - start_time) * 1000)
        
        logger.info(f"[{optimization_id}] === PROMPT EVOLUTION RESULT ===")
        logger.info(f"[{optimization_id}] Original prompt: '{data['prompt']}'")
        logger.info(f"[{optimization_id}] Best prompt: '{best_prompt['prompt']}'")
                
        return jsonify({
            "status": "success",
            "optimization_id": optimization_id,
            "original_prompt": data['prompt'],
            "original_response": base_prompt_reponse,
            "optimized_prompt": best_prompt['prompt'],
            "optimized_response": best_prompt['response'],
            "model": model_id,
            "metrics": {
                "processing_time_ms": processing_time_ms,
                "iterations": iterations,
                "candidates_per_iteration": candidates_per_round,
                "total_candidates_generated": iterations * candidates_per_round,
                "original_length": len(data['prompt']),
                "optimized_length": len(best_prompt['prompt']),
                "length_change": len(best_prompt['prompt']) - len(data['prompt'])
            },
            "configuration": {
                "temperature": temperature,
                "max_tokens": max_tokens,
                "iterations": iterations,
                "candidates_per_round": candidates_per_round,
                "token_limits": max_tokens,
                "temperature": temperature
            }
        })
    except Exception as e:
        end_time = time.time()
        processing_time_ms = round((end_time - start_time) * 1000)
        logger.error(f"[{optimization_id}] Error during optimization: {str(e)}")
        return jsonify({
            "status": "error",
            "optimization_id": optimization_id,
            "error": str(e),
            "metrics": {
                "processing_time_ms": processing_time_ms
            }
        }), 500        
                




# @app.route('/chat', methods=['POST'])
# def chat():
    # """Generate chat response using Gemini API"""
    # start_time = time.time()
    
    # try:
    #     data = request.json
        
    #     if not data:
    #         return jsonify({'error': 'No data provided'}), 400
        
    #     if 'messages' not in data:
    #         return jsonify({'error': 'Messages are required'}), 400
        
    #     messages = data['messages']
    #     temperature = data.get('temperature', 0.7)
    #     top_p = data.get('top_p', 1.0)
    #     max_tokens = data.get('max_tokens', 256)
        
    #     # Handle parameters nested in 'parameters' object
    #     if 'parameters' in data:
    #         params = data['parameters']
    #         temperature = params.get("temperature", temperature)
    #         top_p = params.get("top_p", top_p)
    #         max_tokens = params.get("max_tokens", max_tokens)
        
    #     # Convert chat messages to a single prompt for Gemini
    #     # This is a simple conversion - you might want to make it more sophisticated
    #     prompt_parts = []
    #     for message in messages:
    #         role = message.get('role', 'user')
    #         content = message.get('content', '')
    #         if role == 'user':
    #             prompt_parts.append(f"User: {content}")
    #         elif role == 'assistant':
    #             prompt_parts.append(f"Assistant: {content}")
    #         elif role == 'system':
    #             prompt_parts.append(f"System: {content}")
        
    #     prompt = "\n".join(prompt_parts) + "\nAssistant:"
        
    #     payload = {
    #         "contents": [{"parts": [{"text": prompt}]}],
    #         "generationConfig": {
    #             "temperature": temperature,
    #             "topP": top_p,
    #             "maxOutputTokens": max_tokens
    #         }
    #     }

    #     headers = { "Content-Type": "application/json" }
    #     params = { "key": GEMINI_API_KEY }

    #     logger.info(f"Generating chat response with Gemini 1.5 Flash")
    #     response = requests.post(GEMINI_API_URL, headers=headers, params=params, json=payload)
    #     response.raise_for_status()
    #     result = response.json()
        
    #     text = result["candidates"][0]["content"]["parts"][0]["text"]
        
    #     # Calculate metrics
    #     end_time = time.time()
    #     processing_time_ms = round((end_time - start_time) * 1000)
        
    #     tokens_input = len(prompt.split()) * 1.3
    #     tokens_output = len(text.split()) * 1.3

    #     logger.info(f"Returning: {jsonify({
    #         "status": "success",
    #         "output": text,
    #         "model": "gemini-1.5-flash",
    #         "metrics": {
    #             "processing_time_ms": processing_time_ms,
    #             "tokens_input": int(tokens_input),
    #             "tokens_output": int(tokens_output),
    #             "total_tokens": int(tokens_input + tokens_output)
    #         },
    #         "log": ["Generated chat response with Gemini 1.5 Flash"]
    #     })}")
        
    #     return jsonify({
    #         "status": "success",
    #         "output": text,
    #         "model": "gemini-1.5-flash",
    #         "metrics": {
    #             "processing_time_ms": processing_time_ms,
    #             "tokens_input": int(tokens_input),
    #             "tokens_output": int(tokens_output),
    #             "total_tokens": int(tokens_input + tokens_output)
    #         },
    #         "log": ["Generated chat response with Gemini 1.5 Flash"]
    #     })
        
    # except Exception as e:
    #     logger.error(f"Error generating chat response: {str(e)}")
    #     end_time = time.time()
    #     processing_time_ms = round((end_time - start_time) * 1000)
        
    #     return jsonify({
    #         "status": "error",
    #         "error": str(e),
    #         "metrics": {
    #             "processing_time_ms": processing_time_ms
    #         }
    #     }), 500

# @app.route('/optimize-prompt', methods=['POST'])
# def optimize_prompt():
#     """Analyze and optimize a prompt using Gemini"""
#     start_time = time.time()
    
#     try:
#         data = request.json
        
#         if not data:
#             return jsonify({'error': 'No data provided'}), 400
        
#         if 'prompt' not in data:
#             return jsonify({'error': 'Prompt to optimize is required'}), 400
        
#         prompt = data['prompt']
#         optimization_type = data.get('type', 'complete')
#         target_style = data.get('target_style', 'clear and effective')
        
#         # Create optimization prompt
#         if optimization_type == 'rewrite':
#             optimization_prompt = f"Please rewrite the following prompt to be {target_style}:\n\n{prompt}\n\nRewritten prompt:"
#         elif optimization_type == 'enhance':
#             optimization_prompt = f"Please enhance the following prompt to be {target_style}:\n\n{prompt}\n\nEnhanced prompt:"
#         else:  # complete
#             optimization_prompt = f"Please analyze and improve the following prompt to be {target_style}. Provide suggestions and a better version:\n\n{prompt}\n\nAnalysis and improved prompt:"
        
#         payload = {
#             "contents": [{"parts": [{"text": optimization_prompt}]}],
#             "generationConfig": {
#                 "temperature": 0.3,  # Lower temperature for more consistent optimization
#                 "topP": 1.0,
#                 "maxOutputTokens": 512
#             }
#         }

#         headers = { "Content-Type": "application/json" }
#         params = { "key": GEMINI_API_KEY }

#         response = requests.post(GEMINI_API_URL, headers=headers, params=params, json=payload)
#         response.raise_for_status()
#         result = response.json()
        
#         optimized_text = result["candidates"][0]["content"]["parts"][0]["text"]
        
#         end_time = time.time()
#         processing_time_ms = round((end_time - start_time) * 1000)
        
#         return jsonify({
#             "status": "success",
#             "original_prompt": prompt,
#             "optimized_prompt": optimized_text,
#             "optimization_type": optimization_type,
#             "target_style": target_style,
#             "model": "gemini-1.5-flash",
#             "metrics": {
#                 "processing_time_ms": processing_time_ms
#             }
#         })
        
#     except Exception as e:
#         logger.error(f"Error optimizing prompt: {str(e)}")
#         end_time = time.time()
#         processing_time_ms = round((end_time - start_time) * 1000)
        
#         return jsonify({
#             "status": "error",
#             "error": str(e),
#             "metrics": {
#                 "processing_time_ms": processing_time_ms
#             }
#         }), 500

# @app.route('/suggest-improvements', methods=['POST'])
# def suggest_improvements():
#     """Suggest improvements for a prompt using Gemini"""
#     start_time = time.time()
    
#     try:
#         data = request.json
        
#         if not data:
#             return jsonify({'error': 'No data provided'}), 400
        
#         if 'prompt' not in data:
#             return jsonify({'error': 'Prompt is required'}), 400
        
#         prompt = data['prompt']
#         context = data.get('context', '')
        
#         suggestion_prompt = f"""Please analyze the following prompt and suggest specific improvements:

# Prompt: {prompt}

# Context: {context}

# Please provide:
# 1. Specific areas for improvement
# 2. Concrete suggestions
# 3. An improved version of the prompt

# Analysis:"""
        
#         payload = {
#             "contents": [{"parts": [{"text": suggestion_prompt}]}],
#             "generationConfig": {
#                 "temperature": 0.4,
#                 "topP": 1.0,
#                 "maxOutputTokens": 512
#             }
#         }

#         headers = { "Content-Type": "application/json" }
#         params = { "key": GEMINI_API_KEY }

#         response = requests.post(GEMINI_API_URL, headers=headers, params=params, json=payload)
#         response.raise_for_status()
#         result = response.json()
        
#         suggestions = result["candidates"][0]["content"]["parts"][0]["text"]
        
#         end_time = time.time()
#         processing_time_ms = round((end_time - start_time) * 1000)
        
#         return jsonify({
#             "status": "success",
#             "original_prompt": prompt,
#             "suggestions": suggestions,
#             "context": context,
#             "model": "gemini-1.5-flash",
#             "metrics": {
#                 "processing_time_ms": processing_time_ms
#             }
#         })
        
#     except Exception as e:
#         logger.error(f"Error suggesting improvements: {str(e)}")
#         end_time = time.time()
#         processing_time_ms = round((end_time - start_time) * 1000)
        
#         return jsonify({
#             "status": "error",
#             "error": str(e),
#             "metrics": {
#                 "processing_time_ms": processing_time_ms
#             }
#         }), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True) 