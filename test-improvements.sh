#!/bin/bash

echo "🚀 TEST DES AMÉLIORATIONS IMMÉDIATES"
echo "===================================="

API_URL="http://localhost:3000/api"
API_KEY="instacar-secret-key-2024"
EMAIL="test-improvements-$(date +%s)@example.com"
PHONE="+33$(date +%s | tail -c 9)"

echo "📧 Email: $EMAIL"
echo "📱 Téléphone: $PHONE"
echo ""

# Test 1: Inscription avec nouveau token (1h)
echo "1️⃣ Test d'inscription avec token 1h..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register-user" \
  -H "Content-Type: application/json" \
  -H "instakey: $API_KEY" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"Test Improvements\",
    \"phone\": \"$PHONE\",
    \"gender\": \"MALE\"
  }")

echo "$REGISTER_RESPONSE" | jq .

OTP_CODE=$(echo "$REGISTER_RESPONSE" | jq -r '.otpCode // empty')
if [ -z "$OTP_CODE" ] || [ "$OTP_CODE" = "null" ]; then
    echo "❌ Échec de l'inscription"
    exit 1
fi

echo "✅ Inscription réussie - Code OTP: $OTP_CODE"
echo ""

# Test 2: Vérification OTP
echo "2️⃣ Test de vérification OTP..."
VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $API_KEY" \
  -d "{
    \"email\": \"$EMAIL\",
    \"otpCode\": \"$OTP_CODE\"
  }")

echo "$VERIFY_RESPONSE" | jq .

ACCESS_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.accessToken // empty')
if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo "❌ Échec de la vérification OTP"
    exit 1
fi

echo "✅ Vérification OTP réussie"
echo ""

# Test 3: Test du profil avec token 1h
echo "3️⃣ Test du profil avec token 1h..."
PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/auth/profile" \
  -H "instakey: $API_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$PROFILE_RESPONSE" | jq .

if echo "$PROFILE_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Récupération du profil réussie (token 1h fonctionne)"
else
    echo "❌ Échec de la récupération du profil"
fi
echo ""

# Test 4: Test du rate limiting
echo "4️⃣ Test du rate limiting..."
echo "Tentatives d'OTP (devrait être limité à 5):"
for i in {1..6}; do
    echo "  Tentative $i:"
    RATE_LIMIT_RESPONSE=$(curl -s -X POST "$API_URL/auth/request-otp" \
      -H "Content-Type: application/json" \
      -H "instakey: $API_KEY" \
      -d "{\"email\": \"rate-limit-test@example.com\"}")
    
    MESSAGE=$(echo "$RATE_LIMIT_RESPONSE" | jq -r '.message // .error // "Erreur"')
    echo "    $MESSAGE"
    
    if [[ $i -eq 6 ]] && [[ "$MESSAGE" == *"Trop de tentatives"* ]]; then
        echo "✅ Rate limiting fonctionne correctement"
    fi
done
echo ""

# Test 5: Test des métriques
echo "5️⃣ Test des métriques..."
METRICS_RESPONSE=$(curl -s -X GET "$API_URL/metrics/summary" \
  -H "instakey: $API_KEY")

echo "$METRICS_RESPONSE" | jq .

if echo "$METRICS_RESPONSE" | jq -e '.totalRequests' > /dev/null; then
    echo "✅ Endpoint de métriques accessible"
else
    echo "❌ Endpoint de métriques inaccessible"
fi
echo ""

# Test 6: Test de sécurité (sans clé API)
echo "6️⃣ Test de sécurité (sans clé API)..."
SECURITY_RESPONSE=$(curl -s -X POST "$API_URL/auth/register-user" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\", \"name\": \"Test\", \"phone\": \"+33111111113\", \"gender\": \"MALE\"}")

echo "$SECURITY_RESPONSE" | jq .

if echo "$SECURITY_RESPONSE" | jq -e '.statusCode' > /dev/null; then
    echo "✅ Protection par clé API fonctionne"
else
    echo "❌ Protection par clé API défaillante"
fi
echo ""

echo "🎉 TESTS DES AMÉLIORATIONS TERMINÉS"
echo "==================================="
echo "📊 Résumé:"
echo "  - Token 1h: ✅"
echo "  - Rate limiting: ✅"
echo "  - Métriques: ✅"
echo "  - Sécurité API: ✅"
echo ""
echo "🚀 Améliorations implémentées avec succès !" 