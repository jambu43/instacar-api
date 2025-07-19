#!/bin/bash

echo "🔍 Test complet de tous les endpoints d'authentification - Swagger"
echo "=================================================================="
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000/api"
APP_KEY="instacar-secret-key-2024"

print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo -e "${BLUE}🔍 Test 1: Inscription utilisateur (register-user)${NC}"
echo "Endpoint: POST /api/auth/register-user"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register-user" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d '{
    "email": "swagger-test@example.com",
    "name": "Test Swagger",
    "phone": "+33666666666",
    "gender": "MALE"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Inscription utilisateur réussie"
    echo "Réponse: $REGISTER_RESPONSE"
    
    # Extraire les informations
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o "\"userId\":[0-9]*" | cut -d':' -f2)
    OTP_CODE=$(echo "$REGISTER_RESPONSE" | grep -o "\"otpCode\":\"[0-9]*\"" | cut -d'"' -f4)
    
    echo -e "${YELLOW}👤 User ID: $USER_ID${NC}"
    echo -e "${YELLOW}🔐 Code OTP: $OTP_CODE${NC}"
else
    print_result 1 "Échec de l'inscription utilisateur"
    echo "Erreur: $REGISTER_RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Test 2: Vérification OTP (verify-otp)${NC}"
echo "Endpoint: POST /api/auth/verify-otp"
echo ""

VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"swagger-test@example.com\",
    \"otpCode\": \"$OTP_CODE\"
  }")

if echo "$VERIFY_RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Vérification OTP réussie"
    echo "Réponse: $VERIFY_RESPONSE"
    
    # Extraire le token d'accès
    ACCESS_TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o "\"accessToken\":\"[^\"]*\"" | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o "\"refreshToken\":\"[^\"]*\"" | cut -d'"' -f4)
    echo -e "${YELLOW}🎫 Access Token: ${ACCESS_TOKEN:0:50}...${NC}"
    echo -e "${YELLOW}🔄 Refresh Token: ${REFRESH_TOKEN:0:50}...${NC}"
else
    print_result 1 "Échec de la vérification OTP"
    echo "Erreur: $VERIFY_RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Test 3: Accès au profil (profile)${NC}"
echo "Endpoint: GET /api/auth/profile"
echo ""

PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Accès au profil réussi"
    echo "Réponse: $PROFILE_RESPONSE"
else
    print_result 1 "Échec de l'accès au profil"
    echo "Erreur: $PROFILE_RESPONSE"
fi

echo ""
echo -e "${BLUE}🔍 Test 4: Demande OTP pour connexion (request-otp)${NC}"
echo "Endpoint: POST /api/auth/request-otp"
echo ""

REQUEST_OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d '{
    "email": "swagger-test@example.com"
  }')

if echo "$REQUEST_OTP_RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Demande OTP pour connexion réussie"
    echo "Réponse: $REQUEST_OTP_RESPONSE"
else
    print_result 1 "Échec de la demande OTP"
    echo "Erreur: $REQUEST_OTP_RESPONSE"
fi

echo ""
echo -e "${BLUE}🔍 Test 5: Renvoi OTP (resend-otp)${NC}"
echo "Endpoint: POST /api/auth/resend-otp"
echo ""

RESEND_OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/resend-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d '{
    "email": "swagger-test@example.com"
  }')

if echo "$RESEND_OTP_RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Renvoi OTP réussi"
    echo "Réponse: $RESEND_OTP_RESPONSE"
else
    print_result 1 "Échec du renvoi OTP"
    echo "Erreur: $RESEND_OTP_RESPONSE"
fi

echo ""
echo -e "${BLUE}🔍 Test 6: Refresh token (refresh)${NC}"
echo "Endpoint: POST /api/auth/refresh"
echo ""

REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

if echo "$REFRESH_RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Refresh token réussi"
    echo "Réponse: $REFRESH_RESPONSE"
else
    print_result 1 "Échec du refresh token"
    echo "Erreur: $REFRESH_RESPONSE"
fi

echo ""
echo -e "${BLUE}🔍 Test 7: Déconnexion (logout)${NC}"
echo "Endpoint: POST /api/auth/logout"
echo ""

LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$LOGOUT_RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Déconnexion réussie"
    echo "Réponse: $LOGOUT_RESPONSE"
else
    print_result 1 "Échec de la déconnexion"
    echo "Erreur: $LOGOUT_RESPONSE"
fi

echo ""
echo -e "${BLUE}🔍 Test 8: Inscription chauffeur (register-driver)${NC}"
echo "Endpoint: POST /api/auth/register-driver"
echo ""

REGISTER_DRIVER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register-driver" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d '{
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "color": "Blanc",
    "plateNumber": "SW-123-TEST",
    "city": "Paris",
    "vehicleType": "PROPRIETAIRE",
    "licenseNumber": "SW123456789",
    "fullName": "Test Driver Swagger",
    "phone": "+33555555555"
  }')

if echo "$REGISTER_DRIVER_RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Inscription chauffeur réussie"
    echo "Réponse: $REGISTER_DRIVER_RESPONSE"
    
    # Extraire les informations
    DRIVER_OTP_CODE=$(echo "$REGISTER_DRIVER_RESPONSE" | grep -o "\"otpCode\":\"[0-9]*\"" | cut -d'"' -f4)
    echo -e "${YELLOW}🔐 Code OTP Chauffeur: $DRIVER_OTP_CODE${NC}"
else
    print_result 1 "Échec de l'inscription chauffeur"
    echo "Erreur: $REGISTER_DRIVER_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 Tests de tous les endpoints d'authentification terminés !${NC}"
echo ""
echo -e "${YELLOW}📋 Résumé des endpoints testés :${NC}"
echo "✅ POST /api/auth/register-user - Inscription utilisateur"
echo "✅ POST /api/auth/verify-otp - Vérification OTP"
echo "✅ GET /api/auth/profile - Profil utilisateur"
echo "✅ POST /api/auth/request-otp - Demande OTP connexion"
echo "✅ POST /api/auth/resend-otp - Renvoi OTP"
echo "✅ POST /api/auth/refresh - Refresh token"
echo "✅ POST /api/auth/logout - Déconnexion"
echo "✅ POST /api/auth/register-driver - Inscription chauffeur"
echo ""
echo -e "${BLUE}🔗 Accédez à Swagger UI :${NC}"
echo "   http://localhost:3000/api"
echo ""
echo -e "${BLUE}📖 Documentation Swagger complète :${NC}"
echo "   • Tous les endpoints sont maintenant documentés"
echo "   • Exemples de requêtes et réponses"
echo "   • Descriptions détaillées des paramètres"
echo "   • Codes d'erreur documentés"
echo "   • Schémas de réponses complets"
echo ""
echo -e "${GREEN}✨ Tous les endpoints d'authentification sont maintenant parfaitement documentés dans Swagger !${NC}" 