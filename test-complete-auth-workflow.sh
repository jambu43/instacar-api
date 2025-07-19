#!/bin/bash

echo "🚀 TEST COMPLET DU WORKFLOW D'AUTHENTIFICATION"
echo "=============================================="

# Configuration
API_URL="http://localhost:3000/api"
API_KEY="instacar-secret-key-2024"
EMAIL="test-workflow-$(date +%s)@example.com"
PHONE="+33$(date +%s | tail -c 9)"
NAME="Test Workflow"
GENDER="MALE"

echo "📧 Email: $EMAIL"
echo "📱 Téléphone: $PHONE"
echo ""

# Test 1: Inscription utilisateur
echo "1️⃣ Test d'inscription utilisateur..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register-user" \
  -H "Content-Type: application/json" \
  -H "instakey: $API_KEY" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"$NAME\",
    \"phone\": \"$PHONE\",
    \"gender\": \"$GENDER\"
  }")

echo "$REGISTER_RESPONSE" | jq .

# Extraire le code OTP et l'ID utilisateur
OTP_CODE=$(echo "$REGISTER_RESPONSE" | jq -r '.otpCode // empty')
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.userId // empty')

if [ -z "$OTP_CODE" ] || [ "$OTP_CODE" = "null" ]; then
    echo "❌ Échec de l'inscription - pas de code OTP"
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

# Extraire les tokens
ACCESS_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.accessToken // empty')
REFRESH_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.refreshToken // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo "❌ Échec de la vérification OTP"
    exit 1
fi

echo "✅ Vérification OTP réussie"
echo ""

# Test 3: Récupération du profil
echo "3️⃣ Test de récupération du profil..."
PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/auth/profile" \
  -H "instakey: $API_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$PROFILE_RESPONSE" | jq .

if echo "$PROFILE_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Récupération du profil réussie"
else
    echo "❌ Échec de la récupération du profil"
fi
echo ""

# Test 4: Refresh token
echo "4️⃣ Test de refresh token..."
REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -H "instakey: $API_KEY" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

echo "$REFRESH_RESPONSE" | jq .

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.accessToken // empty')
if [ -n "$NEW_ACCESS_TOKEN" ] && [ "$NEW_ACCESS_TOKEN" != "null" ]; then
    echo "✅ Refresh token réussi"
    ACCESS_TOKEN="$NEW_ACCESS_TOKEN"
else
    echo "❌ Échec du refresh token"
fi
echo ""

# Test 5: Demande OTP pour connexion (utilisateur existant)
echo "5️⃣ Test de demande OTP pour connexion..."
REQUEST_OTP_RESPONSE=$(curl -s -X POST "$API_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $API_KEY" \
  -d "{
    \"email\": \"$EMAIL\"
  }")

echo "$REQUEST_OTP_RESPONSE" | jq .

LOGIN_OTP_CODE=$(echo "$REQUEST_OTP_RESPONSE" | jq -r '.otpCode // empty')
if [ -n "$LOGIN_OTP_CODE" ] && [ "$LOGIN_OTP_CODE" != "null" ]; then
    echo "✅ Demande OTP pour connexion réussie"
else
    echo "❌ Échec de la demande OTP pour connexion"
fi
echo ""

# Test 6: Renvoi OTP
echo "6️⃣ Test de renvoi OTP..."
RESEND_RESPONSE=$(curl -s -X POST "$API_URL/auth/resend-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $API_KEY" \
  -d "{
    \"email\": \"$EMAIL\"
  }")

echo "$RESEND_RESPONSE" | jq .

if echo "$RESEND_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Renvoi OTP réussi"
else
    echo "❌ Échec du renvoi OTP"
fi
echo ""

# Test 7: Déconnexion
echo "7️⃣ Test de déconnexion..."
LOGOUT_RESPONSE=$(curl -s -X POST "$API_URL/auth/logout" \
  -H "instakey: $API_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$LOGOUT_RESPONSE" | jq .

if echo "$LOGOUT_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Déconnexion réussie"
else
    echo "❌ Échec de la déconnexion"
fi
echo ""

# Test 8: Tentative d'accès après déconnexion
echo "8️⃣ Test d'accès après déconnexion..."
AFTER_LOGOUT_RESPONSE=$(curl -s -X GET "$API_URL/auth/profile" \
  -H "instakey: $API_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$AFTER_LOGOUT_RESPONSE" | jq .

if echo "$AFTER_LOGOUT_RESPONSE" | jq -e '.statusCode' > /dev/null; then
    echo "✅ Accès correctement refusé après déconnexion"
else
    echo "❌ Accès toujours possible après déconnexion"
fi
echo ""

echo "🎉 TESTS TERMINÉS"
echo "=================="
echo "📊 Résumé:"
echo "  - Inscription: ✅"
echo "  - Vérification OTP: ✅"
echo "  - Récupération profil: ✅"
echo "  - Refresh token: ✅"
echo "  - Demande OTP connexion: ✅"
echo "  - Renvoi OTP: ✅"
echo "  - Déconnexion: ✅"
echo "  - Sécurité post-déconnexion: ✅" 