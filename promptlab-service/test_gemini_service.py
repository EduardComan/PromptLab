#!/usr/bin/env python3
"""
Test script for PromptLab Gemini Service
Tests basic functionality without requiring a real API key
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Service not running. Start with: python app.py")
        return False

def test_models_endpoint():
    """Test the models listing endpoint"""
    print("Testing models endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/models")
        if response.status_code == 200:
            data = response.json()
            if 'models' in data and len(data['models']) > 0:
                print("✅ Models endpoint working")
                print(f"   Available models: {[m['id'] for m in data['models']]}")
                return True
            else:
                print("❌ No models returned")
                return False
        else:
            print(f"❌ Models endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Models endpoint error: {e}")
        return False

def test_generate_endpoint():
    """Test the generate endpoint (will fail without API key, but should validate input)"""
    print("Testing generate endpoint...")
    try:
        # Test with missing prompt
        response = requests.post(f"{BASE_URL}/generate", json={})
        if response.status_code == 400:
            print("✅ Generate endpoint correctly validates missing prompt")
        
        # Test with valid structure (will fail due to API key, but structure is validated)
        response = requests.post(f"{BASE_URL}/generate", json={
            "prompt": "Test prompt",
            "temperature": 0.7
        })
        
        if response.status_code in [400, 500]:  # Expected without valid API key
            data = response.json()
            if 'error' in data:
                print("✅ Generate endpoint structure working (API key needed for full test)")
                return True
        
        print(f"❌ Unexpected response: {response.status_code}")
        return False
    except Exception as e:
        print(f"❌ Generate endpoint error: {e}")
        return False

def test_chat_endpoint():
    """Test the chat endpoint"""
    print("Testing chat endpoint...")
    try:
        # Test with missing messages
        response = requests.post(f"{BASE_URL}/chat", json={})
        if response.status_code == 400:
            print("✅ Chat endpoint correctly validates missing messages")
        
        # Test with valid structure
        response = requests.post(f"{BASE_URL}/chat", json={
            "messages": [
                {"role": "user", "content": "Hello"}
            ]
        })
        
        if response.status_code in [400, 500]:  # Expected without valid API key
            data = response.json()
            if 'error' in data:
                print("✅ Chat endpoint structure working (API key needed for full test)")
                return True
        
        print(f"❌ Unexpected response: {response.status_code}")
        return False
    except Exception as e:
        print(f"❌ Chat endpoint error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing PromptLab Gemini Service")
    print("=" * 50)
    
    tests = [
        test_health_check,
        test_models_endpoint,
        test_generate_endpoint,
        test_chat_endpoint
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Service is working correctly.")
        print("\n📝 To test with actual generation:")
        print("1. Get a Gemini API key from https://aistudio.google.com/")
        print("2. Set environment variable: export GEMINI_API_KEY='your_key'")
        print("3. Restart the service and test generation endpoints")
    else:
        print("⚠️  Some tests failed. Check the service configuration.")
    
    return passed == total

if __name__ == "__main__":
    main() 