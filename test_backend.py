#!/usr/bin/env python3
"""
Quick test script for the Pricing Power Portfolio MVP backend
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health():
    """Test API health endpoint"""
    print("Testing API health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ API is healthy")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Is the backend running?")
        print("   Run: cd backend && python main.py")
        return False

def test_scores():
    """Test scores endpoint"""
    print("\nTesting scores endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/scores")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Scores fetched: {len(data.get('scores', []))} stocks")
            if data.get('scores'):
                sample = data['scores'][0]
                print(f"   Sample: {sample['ticker']} - Score: {sample['final_score']:.1f}")
            return True
        elif response.status_code == 404:
            print("⚠️  No scores found. Run rebalance first.")
            return True
        else:
            print(f"❌ Failed to fetch scores: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error fetching scores: {e}")
        return False

def test_portfolio():
    """Test portfolio endpoint"""
    print("\nTesting portfolio endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/portfolio")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Portfolio fetched: {data.get('total_stocks', 0)} positions")
            if data.get('weights'):
                total_weight = sum(w['weight'] for w in data['weights'])
                print(f"   Total weight: {total_weight:.1%}")
            return True
        elif response.status_code == 404:
            print("⚠️  No portfolio found. Run rebalance first.")
            return True
        else:
            print(f"❌ Failed to fetch portfolio: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error fetching portfolio: {e}")
        return False

def test_rebalance():
    """Test rebalance endpoint"""
    print("\nTesting rebalance endpoint...")
    print("⏳ This will take 30-60 seconds...")
    
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/rebalance", timeout=120)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Rebalance successful!")
            print(f"   Time: {elapsed:.1f} seconds")
            print(f"   Stocks processed: {data.get('stocks_processed', 0)}")
            print(f"   Message: {data.get('message', '')}")
            return True
        else:
            print(f"❌ Rebalance failed: {response.status_code}")
            if response.text:
                print(f"   Error: {response.text}")
            return False
    except requests.exceptions.Timeout:
        print("❌ Rebalance timeout (>120 seconds)")
        return False
    except Exception as e:
        print(f"❌ Error during rebalance: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 50)
    print("Pricing Power Portfolio MVP - Backend Tests")
    print("=" * 50)
    
    # Check if API is running
    if not test_health():
        print("\n⚠️  Please start the backend first:")
        print("   cd backend && python main.py")
        return
    
    # Test other endpoints
    test_scores()
    test_portfolio()
    
    # Ask before running rebalance
    print("\n" + "=" * 50)
    response = input("Run rebalance test? This will take 30-60 seconds (y/n): ")
    if response.lower() == 'y':
        if test_rebalance():
            print("\n✅ Rebalance complete! Now testing updated data...")
            test_scores()
            test_portfolio()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("\nAPI Documentation: http://localhost:8000/docs")
    print("Frontend: http://localhost:3000")

if __name__ == "__main__":
    main()