#!/bin/bash

# Test script for frontend-backend integration
# Tests: Login, CSRF token handling, and product creation

set -e

API_URL="http://localhost:8000"
COOKIES_JAR="/tmp/cookies.jar"

echo "🧪 Testing Scarf Store Frontend-Backend Integration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Clean up old cookies
rm -f "$COOKIES_JAR"

echo ""
echo "✅ Step 1: Login to Admin Account"
LOGIN_RESPONSE=$(curl -s -c "$COOKIES_JAR" -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@scarfstore.com",
    "password": "admin123"
  }')

echo "Response: $LOGIN_RESPONSE"

# Extract CSRF token
CSRF_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"csrf_token":"[^"]*' | cut -d'"' -f4)
echo "CSRF Token: $CSRF_TOKEN"

if [ -z "$CSRF_TOKEN" ]; then
  echo "❌ Failed to get CSRF token from login response"
  exit 1
fi

echo ""
echo "✅ Step 2: Create a Test Product"
CREATE_RESPONSE=$(curl -s -b "$COOKIES_JAR" -X POST "$API_URL/api/v1/admin/products" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{
    "sku": "TEST-SCARF-'$(date +%s)'",
    "name": "Test Scarf Product",
    "short_description": "A test scarf for integration testing",
    "long_description": "This is a test product created during integration testing",
    "price": 99.99,
    "discount_percentage": 10,
    "stock": 50,
    "color": "Blue",
    "material": "Wool 100%",
    "is_featured": true,
    "is_new": true,
    "is_active": true
  }')

echo "Response: $CREATE_RESPONSE"

# Check if product was created successfully
if echo "$CREATE_RESPONSE" | grep -q '"id":'; then
  PRODUCT_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "✅ Product created successfully! ID: $PRODUCT_ID"
else
  echo "❌ Failed to create product"
  exit 1
fi

echo ""
echo "✅ Step 3: Get Product Details"
GET_RESPONSE=$(curl -s -b "$COOKIES_JAR" -X GET "$API_URL/api/v1/products/$PRODUCT_ID")
echo "Response: $GET_RESPONSE"

echo ""
echo "✅ Step 4: List All Products"
LIST_RESPONSE=$(curl -s -b "$COOKIES_JAR" -X GET "$API_URL/api/v1/products?limit=5")
echo "Response (first 200 chars): ${LIST_RESPONSE:0:200}..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All integration tests passed!"
echo ""
echo "Frontend URL: http://localhost:3001"
echo "Login page: http://localhost:3001/login"
echo "Admin dashboard: http://localhost:3001/admin/dashboard"
echo ""
echo "Test credentials:"
echo "  Email: admin@scarfstore.com"
echo "  Password: admin123"
