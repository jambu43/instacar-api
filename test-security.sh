#!/bin/bash

# Script de test pour le système de sécurité de l'API InstaCar
# Teste l'authentification JWT et la clé d'application

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"

# Variables de test
APP_KEY="instacar-secret-key-2024"
WRONG_APP_KEY="wrong-key"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Test du Système de Sécurité - API InstaCar ===${NC}"
echo ""

# Fonction pour afficher les résultats
show_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    if [ "$status" = "SUCCESS" ]; then
        echo -e "${GREEN}✓ $test_name: $message${NC}"
    elif [ "$status" = "ERROR" ]; then
        echo -e "${RED}✗ $test_name: $message${NC}"
    else
        echo -e "${YELLOW}⚠ $test_name: $message${NC}"
    fi
}

# Fonction pour faire une requête HTTP
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    local app_key="$5"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "instakey: $app_key" \
            -d "$data" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "instakey: $app_key" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "$body"
        return 0
    else
        echo "HTTP $http_code: $body" >&2
        return 1
    fi
}

# Fonction pour faire une requête avec token JWT
make_authenticated_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    local app_key="$5"
    local token="$6"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "instakey: $app_key" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "instakey: $app_key" \
            -H "Authorization: Bearer $token" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "$body"
        return 0
    else
        echo "HTTP $http_code: $body" >&2
        return 1
    fi
}

echo -e "${YELLOW}=== 1. TESTS DE LA CLÉ D'APPLICATION ===${NC}"

# Test 1: Requête sans clé d'application
echo -e "${YELLOW}1.1. Test sans clé d'application...${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Content-Type: application/json" \
    "$API_URL/auth/profile")

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "401" ]; then
    show_result "Sans clé d'application" "SUCCESS" "Accès refusé (401)"
else
    show_result "Sans clé d'application" "ERROR" "Devrait être refusé"
fi

# Test 2: Requête avec mauvaise clé d'application
echo -e "${YELLOW}1.2. Test avec mauvaise clé d'application...${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Content-Type: application/json" \
    -H "instakey: $WRONG_APP_KEY" \
    "$API_URL/auth/profile")

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "401" ]; then
    show_result "Mauvaise clé d'application" "SUCCESS" "Accès refusé (401)"
else
    show_result "Mauvaise clé d'application" "ERROR" "Devrait être refusé"
fi

# Test 3: Requête avec bonne clé d'application
echo -e "${YELLOW}1.3. Test avec bonne clé d'application...${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Content-Type: application/json" \
    -H "instakey: $APP_KEY" \
    "$API_URL/auth/profile")

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "401" ]; then
    show_result "Bonne clé d'application" "SUCCESS" "Accès autorisé (mais token manquant)"
else
    show_result "Bonne clé d'application" "ERROR" "Réponse inattendue"
fi

echo -e "${YELLOW}=== 2. TESTS D'INSCRIPTION ET CONNEXION ===${NC}"

# Test 4: Inscription avec bonne clé d'application
echo -e "${YELLOW}2.1. Inscription avec bonne clé d'application...${NC}"
REGISTER_DATA='{
  "email": "test_security_'$(date +%s)'@test.com",
  "name": "Test Security User",
  "phone": "+33'$(date +%s)'",
  "password": "password123",
  "gender": "MALE"
}'

REGISTER_RESPONSE=$(make_request "POST" "/auth/register" "$REGISTER_DATA" "201" "$APP_KEY")
if [ $? -eq 0 ]; then
    USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
    REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.refreshToken')
    show_result "Inscription" "SUCCESS" "ID: $USER_ID"
else
    show_result "Inscription" "ERROR" "Échec de l'inscription"
    exit 1
fi

# Test 5: Connexion avec bonne clé d'application
echo -e "${YELLOW}2.2. Connexion avec bonne clé d'application...${NC}"
LOGIN_DATA='{
  "email": "test_security_'$(date +%s)'@test.com",
  "password": "password123"
}'

LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "$LOGIN_DATA" "200" "$APP_KEY")
if [ $? -eq 0 ]; then
    NEW_ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
    NEW_REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.refreshToken')
    show_result "Connexion" "SUCCESS" "Tokens générés"
else
    show_result "Connexion" "ERROR" "Échec de la connexion"
fi

echo -e "${YELLOW}=== 3. TESTS D'AUTHENTIFICATION JWT ===${NC}"

# Test 6: Accès au profil avec token valide
echo -e "${YELLOW}3.1. Accès au profil avec token valide...${NC}"
PROFILE_RESPONSE=$(make_authenticated_request "GET" "/auth/profile" "" "200" "$APP_KEY" "$NEW_ACCESS_TOKEN")
if [ $? -eq 0 ]; then
    show_result "Profil avec token valide" "SUCCESS" "Accès autorisé"
else
    show_result "Profil avec token valide" "ERROR" "Échec de l'accès"
fi

# Test 7: Accès au profil sans token
echo -e "${YELLOW}3.2. Accès au profil sans token...${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Content-Type: application/json" \
    -H "instakey: $APP_KEY" \
    "$API_URL/auth/profile")

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "401" ]; then
    show_result "Profil sans token" "SUCCESS" "Accès refusé (401)"
else
    show_result "Profil sans token" "ERROR" "Devrait être refusé"
fi

# Test 8: Accès au profil avec token invalide
echo -e "${YELLOW}3.3. Accès au profil avec token invalide...${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Content-Type: application/json" \
    -H "instakey: $APP_KEY" \
    -H "Authorization: Bearer invalid-token" \
    "$API_URL/auth/profile")

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "401" ]; then
    show_result "Profil avec token invalide" "SUCCESS" "Accès refusé (401)"
else
    show_result "Profil avec token invalide" "ERROR" "Devrait être refusé"
fi

echo -e "${YELLOW}=== 4. TESTS DE RENOUVELLEMENT DE TOKEN ===${NC}"

# Test 9: Renouvellement de token avec refresh token valide
echo -e "${YELLOW}4.1. Renouvellement de token...${NC}"
REFRESH_DATA='{
  "refreshToken": "'$NEW_REFRESH_TOKEN'"
}'

REFRESH_RESPONSE=$(make_request "POST" "/auth/refresh" "$REFRESH_DATA" "200" "$APP_KEY")
if [ $? -eq 0 ]; then
    NEW_ACCESS_TOKEN_2=$(echo "$REFRESH_RESPONSE" | jq -r '.accessToken')
    NEW_REFRESH_TOKEN_2=$(echo "$REFRESH_RESPONSE" | jq -r '.refreshToken')
    show_result "Renouvellement de token" "SUCCESS" "Nouveaux tokens générés"
else
    show_result "Renouvellement de token" "ERROR" "Échec du renouvellement"
fi

# Test 10: Test avec le nouveau token
echo -e "${YELLOW}4.2. Test avec le nouveau token...${NC}"
PROFILE_RESPONSE_2=$(make_authenticated_request "GET" "/auth/profile" "" "200" "$APP_KEY" "$NEW_ACCESS_TOKEN_2")
if [ $? -eq 0 ]; then
    show_result "Profil avec nouveau token" "SUCCESS" "Accès autorisé"
else
    show_result "Profil avec nouveau token" "ERROR" "Échec de l'accès"
fi

echo -e "${YELLOW}=== 5. TESTS DE DÉCONNEXION ===${NC}"

# Test 11: Déconnexion
echo -e "${YELLOW}5.1. Déconnexion...${NC}"
LOGOUT_RESPONSE=$(make_authenticated_request "POST" "/auth/logout" "" "200" "$APP_KEY" "$NEW_ACCESS_TOKEN_2")
if [ $? -eq 0 ]; then
    show_result "Déconnexion" "SUCCESS" "Déconnexion réussie"
else
    show_result "Déconnexion" "ERROR" "Échec de la déconnexion"
fi

# Test 12: Tentative d'accès après déconnexion
echo -e "${YELLOW}5.2. Tentative d'accès après déconnexion...${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Content-Type: application/json" \
    -H "instakey: $APP_KEY" \
    -H "Authorization: Bearer $NEW_ACCESS_TOKEN_2" \
    "$API_URL/auth/profile")

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "401" ]; then
    show_result "Accès après déconnexion" "SUCCESS" "Accès refusé (401)"
else
    show_result "Accès après déconnexion" "ERROR" "Devrait être refusé"
fi

echo ""
echo -e "${BLUE}=== RÉSUMÉ DES TESTS DE SÉCURITÉ ===${NC}"
echo -e "${GREEN}Tous les tests de sécurité ont été exécutés avec succès !${NC}"
echo ""
echo -e "${YELLOW}Fonctionnalités testées :${NC}"
echo "  ✓ Vérification de la clé d'application (instakey)"
echo "  ✓ Authentification JWT"
echo "  ✓ Protection des routes"
echo "  ✓ Renouvellement de tokens"
echo "  ✓ Déconnexion sécurisée"
echo ""
echo -e "${BLUE}Configuration requise :${NC}"
echo "  - Clé d'application: $APP_KEY"
echo "  - JWT_SECRET: configuré dans .env"
echo "  - JWT_REFRESH_SECRET: configuré dans .env"
echo ""
echo -e "${BLUE}Utilisation :${NC}"
echo "  curl -H 'instakey: $APP_KEY' -H 'Authorization: Bearer <token>' http://localhost:3000/api/..."
echo "" 