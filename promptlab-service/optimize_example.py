import requests
import json
import sys
import argparse
import time


def optimize_prompt(prompt, target=None, model="tinyllama", server_url="http://localhost:5000"):
    """
    Send a prompt to the optimization service and get the results
    
    Args:
        prompt: The prompt to optimize
        target: Optional target goal
        model: Model to use for optimization
        server_url: URL of the promptlab service
    
    Returns:
        The optimization results
    """
    url = f"{server_url}/optimize-prompt"
    
    payload = {
        "prompt": prompt,
        "model": model
    }
    
    if target:
        payload["target"] = target
        
    try:
        print(f"⏳ Optimizing prompt using {model}...")
        start_time = time.time()
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        end_time = time.time()
        duration = round((end_time - start_time) * 1000)
        
        print(f"✅ Optimization completed in {duration}ms")
        
        if result.get("status") == "success":
            print("\n----- ORIGINAL PROMPT -----")
            print(prompt)
            print("\n----- OPTIMIZATION -----")
            print(result.get("optimization"))
            
            metrics = result.get("metrics", {})
            if metrics:
                print("\n----- METRICS -----")
                print(f"Processing time: {metrics.get('processing_time_ms')}ms")
                print(f"Input tokens: {metrics.get('tokens_input')}")
                print(f"Output tokens: {metrics.get('tokens_output')}")
                print(f"Total tokens: {metrics.get('total_tokens')}")
        else:
            print(f"❌ Error: {result.get('error')}")
        
        return result
    
    except Exception as e:
        print(f"❌ Failed to optimize prompt: {str(e)}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Optimize a prompt using the PromptLab service")
    parser.add_argument("--prompt", type=str, help="The prompt to optimize")
    parser.add_argument("--target", type=str, help="Optional target goal for the prompt")
    parser.add_argument("--model", type=str, default="tinyllama", help="Model to use (default: tinyllama)")
    parser.add_argument("--server", type=str, default="http://localhost:5000", help="Server URL")
    parser.add_argument("--file", type=str, help="File containing the prompt to optimize")
    
    args = parser.parse_args()
    
    # Get prompt from file or command line
    prompt = None
    if args.file:
        try:
            with open(args.file, 'r', encoding='utf-8') as f:
                prompt = f.read()
        except Exception as e:
            print(f"❌ Failed to read prompt file: {str(e)}")
            return 1
    elif args.prompt:
        prompt = args.prompt
    else:
        # Use an example prompt
        prompt = """Create a function that takes two numbers as arguments and returns the sum of those numbers."""
        print("Using example prompt since none was provided.")
    
    # Optimize the prompt
    result = optimize_prompt(
        prompt=prompt,
        target=args.target,
        model=args.model,
        server_url=args.server
    )
    
    return 0 if result and result.get("status") == "success" else 1


if __name__ == "__main__":
    sys.exit(main()) 