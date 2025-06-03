#!/usr/bin/env python3
"""
PromptLab Service Startup Script
"""

import sys
import subprocess
import os

def check_dependencies():
    """Check if required packages are installed"""
    required = ['flask', 'transformers', 'torch']
    missing = []
    
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"❌ Missing packages: {', '.join(missing)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    print("✅ All dependencies installed")
    return True

def start_service():
    """Start the PromptLab service"""
    print("🚀 Starting PromptLab Service...")
    
    if not check_dependencies():
        sys.exit(1)
    
    try:
        # Start the Flask app
        os.system("python app.py")
    except KeyboardInterrupt:
        print("\n👋 Service stopped")
    except Exception as e:
        print(f"❌ Error starting service: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_service() 