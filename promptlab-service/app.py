from flask import Flask, request, jsonify
import logging
import time
import os
import json
from models import get_model, available_models
from utils import validate_parameters

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'promptlab-service'})

@app.route('/models', methods=['GET'])
def list_models():
    """List available models"""
    return jsonify({
        'models': available_models()
    })

@app.route('/generate', methods=['POST'])
def generate():
    """Generate text using the specified model"""
    start_time = time.time()
    
    try:
        data = request.json
        
        # Validate required fields
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'model' not in data:
            return jsonify({'error': 'Model name is required'}), 400
        
        if 'prompt' not in data:
            return jsonify({'error': 'Prompt is required'}), 400
        
        model_name = data['model']
        prompt = data['prompt']
        parameters = data.get('parameters', {})
        
        # Validate parameters
        valid_params, error_msg = validate_parameters(model_name, parameters)
        if not valid_params:
            return jsonify({'error': error_msg}), 400
        
        # Get the model
        model = get_model(model_name)
        if not model:
            return jsonify({'error': f'Model {model_name} not found or not available'}), 404
        
        # Generate text
        logger.info(f"Generating text with model {model_name}")
        result = model.generate(prompt, parameters)
        
        # Calculate metrics
        end_time = time.time()
        processing_time_ms = round((end_time - start_time) * 1000)
        
        # Prepare response
        response = {
            'status': 'success',
            'output': result.get('output', ''),
            'model': model_name,
            'metrics': {
                'processing_time_ms': processing_time_ms,
                'tokens_input': result.get('tokens_input', 0),
                'tokens_output': result.get('tokens_output', 0),
                'total_tokens': result.get('tokens_input', 0) + result.get('tokens_output', 0)
            },
            'log': result.get('log', [])
        }
        
        return jsonify(response)
    
    except Exception as e:
        logger.exception(f"Error generating text: {str(e)}")
        
        # Calculate metrics even on failure
        end_time = time.time()
        processing_time_ms = round((end_time - start_time) * 1000)
        
        return jsonify({
            'status': 'error',
            'error': str(e),
            'metrics': {
                'processing_time_ms': processing_time_ms
            }
        }), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Generate chat response using the specified model"""
    start_time = time.time()
    
    try:
        data = request.json
        
        # Validate required fields
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'model' not in data:
            return jsonify({'error': 'Model name is required'}), 400
        
        if 'messages' not in data:
            return jsonify({'error': 'Messages are required'}), 400
        
        model_name = data['model']
        messages = data['messages']
        parameters = data.get('parameters', {})
        
        # Validate parameters
        valid_params, error_msg = validate_parameters(model_name, parameters)
        if not valid_params:
            return jsonify({'error': error_msg}), 400
        
        # Validate messages format
        if not isinstance(messages, list):
            return jsonify({'error': 'Messages must be an array'}), 400
        
        for message in messages:
            if not isinstance(message, dict) or 'role' not in message or 'content' not in message:
                return jsonify({'error': 'Each message must have role and content fields'}), 400
        
        # Get the model
        model = get_model(model_name)
        if not model:
            return jsonify({'error': f'Model {model_name} not found or not available'}), 404
        
        # Generate chat response
        logger.info(f"Generating chat response with model {model_name}")
        result = model.chat(messages, parameters)
        
        # Calculate metrics
        end_time = time.time()
        processing_time_ms = round((end_time - start_time) * 1000)
        
        # Prepare response
        response = {
            'status': 'success',
            'output': result.get('output', ''),
            'model': model_name,
            'metrics': {
                'processing_time_ms': processing_time_ms,
                'tokens_input': result.get('tokens_input', 0),
                'tokens_output': result.get('tokens_output', 0),
                'total_tokens': result.get('tokens_input', 0) + result.get('tokens_output', 0)
            },
            'log': result.get('log', [])
        }
        
        return jsonify(response)
    
    except Exception as e:
        logger.exception(f"Error generating chat response: {str(e)}")
        
        # Calculate metrics even on failure
        end_time = time.time()
        processing_time_ms = round((end_time - start_time) * 1000)
        
        return jsonify({
            'status': 'error',
            'error': str(e),
            'metrics': {
                'processing_time_ms': processing_time_ms
            }
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 