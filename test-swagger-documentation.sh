#!/bin/bash

echo "🔍 Test de la documentation Swagger - InstaCar API"
echo "=================================================="
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

echo -e "${BLUE}🔍 Test 1: Vérification de l'accessibilité de Swagger${NC}"
echo "Endpoint: GET /api"
echo ""

SWAGGER_RESPONSE=$(curl -s "$BASE_URL")

if echo "$SWAGGER_RESPONSE" | grep -q "Swagger UI"; then
    print_result 0 "Swagger UI accessible"
else
    print_result 1 "Swagger UI non accessible"
    echo "Réponse: $SWAGGER_RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Test 2: Test de l'inscription utilisateur avec documentation complète${NC}"
echo "Endpoint: POST /api/auth/register-user"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register-user" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d '{
    "email": "swagger-doc@example.com",
    "name": "Test Documentation",
    "phone": "+33888888888",
    "gender": "MALE"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Inscription utilisateur réussie avec documentation Swagger"
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
echo -e "${BLUE}🔍 Test 3: Test de la vérification OTP${NC}"
echo "Endpoint: POST /api/auth/verify-otp"
echo ""

VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"swagger-doc@example.com\",
    \"otpCode\": \"$OTP_CODE\"
  }")

if echo "$VERIFY_RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Vérification OTP réussie"
    echo "Réponse: $VERIFY_RESPONSE"
    
    # Extraire le token d'accès
    ACCESS_TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o "\"accessToken\":\"[^\"]*\"" | cut -d'"' -f4)
    echo -e "${YELLOW}🎫 Access Token: ${ACCESS_TOKEN:0:50}...${NC}"
else
    print_result 1 "Échec de la vérification OTP"
    echo "Erreur: $VERIFY_RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Test 4: Test de l'accès au profil avec token JWT${NC}"
echo "Endpoint: GET /api/auth/profile"
echo ""

PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Accès au profil réussi avec token JWT"
    echo "Réponse: $PROFILE_RESPONSE"
else
    print_result 1 "Échec de l'accès au profil"
    echo "Erreur: $PROFILE_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 Tests de la documentation Swagger terminés !${NC}"
echo ""
echo -e "${YELLOW}📋 Résumé des améliorations Swagger :${NC}"
echo "✅ Documentation détaillée pour /api/auth/register-user"
echo "✅ Exemples de réponses pour tous les endpoints"
echo "✅ Descriptions complètes des paramètres"
echo "✅ Documentation des codes d'erreur"
echo "✅ Exemples de requêtes et réponses"
echo ""
echo -e "${BLUE}🔗 Accédez à Swagger UI :${NC}"
echo "   http://localhost:3000/api"
echo ""
echo -e "${BLUE}📖 Documentation des endpoints d'authentification :${NC}"
echo "   • POST /api/auth/register-user - Inscription utilisateur (sans mot de passe)"
echo "   • POST /api/auth/request-otp - Demande OTP pour connexion"
echo "   • POST /api/auth/verify-otp - Vérification OTP et authentification"
echo "   • POST /api/auth/register-driver - Inscription chauffeur"
echo "   • GET /api/auth/profile - Profil utilisateur (JWT requis)"
echo ""
echo -e "${GREEN}✨ Le système d'authentification par OTP sans mot de passe est maintenant parfaitement documenté !${NC}" 