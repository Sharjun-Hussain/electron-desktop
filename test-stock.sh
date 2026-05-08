#!/bin/bash
RES=$(curl -s -X POST http://localhost:5000/api/v1/login -H "Content-Type: application/json" -d '{"email":"admin@emipos.com", "password":"admin123"}')
TOKEN=$(echo "$RES" | grep -o '"auth_token":"[^"]*' | cut -d'"' -f4)
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5000/api/v1/stocks?page=1&size=500"
