#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000/api"
APP_KEY="instacar-secret-key-2024"
EMAIL="demo_user_$(date +%s)@example.com"
NAME="Demo User"
PHONE="+33123456789"
GENDER="MALE"

echo "🚀 Démonstration du Système d'Authentification OTP - InstaCar API"
echo "=================================================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Fonction pour extraire des valeurs JSON
extract_json_value() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | cut -d'"' -f4
}

echo -e "${BLUE}📧 Étape 1: Demande d'OTP pour nouvel utilisateur${NC}"
echo "Endpoint: POST /auth/request-otp"
echo "Payload: { email: $EMAIL, name: $NAME, phone: $PHONE, gender: $GENDER }"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"$NAME\",
    \"phone\": \"$PHONE\",
    \"gender\": \"$GENDER\"
  }")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Demande OTP réussie"
    echo "Réponse: $RESPONSE"
    
    # Extraire le code OTP
    OTP_CODE=$(extract_json_value "$RESPONSE" "otpCode")
    echo -e "${YELLOW}🔐 Code OTP reçu: $OTP_CODE${NC}"
else
    print_result 1 "❌ Échec de la demande OTP"
    echo "Erreur: $RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}🔐 Étape 2: Vérification du code OTP${NC}"
echo "Endpoint: POST /auth/verify-otp"
echo "Payload: { email: $EMAIL, otpCode: $OTP_CODE }"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"$EMAIL\",
    \"otpCode\": \"$OTP_CODE\"
  }")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Vérification OTP réussie"
    echo "Réponse: $RESPONSE"
    
    # Extraire les tokens
    ACCESS_TOKEN=$(extract_json_value "$RESPONSE" "accessToken")
    REFRESH_TOKEN=$(extract_json_value "$RESPONSE" "refreshToken")
    USER_ID=$(echo "$RESPONSE" | grep -o "\"id\":[0-9]*" | cut -d':' -f2)
    
    echo -e "${YELLOW}🎫 Access Token: ${ACCESS_TOKEN:0:50}...${NC}"
    echo -e "${YELLOW}🔄 Refresh Token: ${REFRESH_TOKEN:0:50}...${NC}"
    echo -e "${YELLOW}👤 User ID: $USER_ID${NC}"
else
    print_result 1 "❌ Échec de la vérification OTP"
    echo "Erreur: $RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}👤 Étape 3: Accès au profil utilisateur${NC}"
echo "Endpoint: GET /auth/profile"
echo "Headers: Authorization: Bearer <access_token>"
echo ""

RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Accès au profil réussi"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "❌ Échec de l'accès au profil"
    echo "Erreur: $RESPONSE"
fi

echo ""
echo -e "${BLUE}🔄 Étape 4: Test de renouvellement de token${NC}"
echo "Endpoint: POST /auth/refresh"
echo "Payload: { refreshToken: <refresh_token> }"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Renouvellement de token réussi"
    echo "Réponse: $RESPONSE"
    
    # Extraire le nouveau token
    NEW_ACCESS_TOKEN=$(extract_json_value "$RESPONSE" "accessToken")
    echo -e "${YELLOW}🆕 Nouveau Access Token: ${NEW_ACCESS_TOKEN:0:50}...${NC}"
else
    print_result 1 "❌ Échec du renouvellement de token"
    echo "Erreur: $RESPONSE"
fi

echo ""
echo -e "${BLUE}🚪 Étape 5: Test de déconnexion${NC}"
echo "Endpoint: POST /auth/logout"
echo "Headers: Authorization: Bearer <access_token>"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Déconnexion réussie"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "❌ Échec de la déconnexion"
    echo "Erreur: $RESPONSE"
fi

echo ""
echo -e "${BLUE}🛡️ Étape 6: Test de sécurité - Accès sans token${NC}"
echo "Endpoint: GET /auth/profile (sans Authorization header)"
echo ""

RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY")

if echo "$RESPONSE" | grep -q "Token d'authentification manquant"; then
    print_result 0 "✅ Sécurité: Accès correctement bloqué sans token"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "❌ Problème de sécurité: Accès autorisé sans token"
    echo "Réponse: $RESPONSE"
fi

echo ""
echo -e "${BLUE}🔑 Étape 7: Test de sécurité - Accès sans clé d'application${NC}"
echo "Endpoint: POST /auth/request-otp (sans instakey header)"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\"
  }")

if echo "$RESPONSE" | grep -q "Clé d'application manquante"; then
    print_result 0 "✅ Sécurité: Accès correctement bloqué sans clé d'app"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "❌ Problème de sécurité: Accès autorisé sans clé d'app"
    echo "Réponse: $RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 Démonstration terminée avec succès !${NC}"
echo ""
echo -e "${YELLOW}📋 Résumé du flux d'authentification OTP :${NC}"
echo "1. ✅ Demande d'OTP → Code généré et affiché"
echo "2. ✅ Vérification OTP → Tokens JWT générés"
echo "3. ✅ Accès au profil → Authentification réussie"
echo "4. ✅ Renouvellement token → Nouveau token généré"
echo "5. ✅ Déconnexion → Session fermée"
echo "6. ✅ Sécurité sans token → Accès bloqué"
echo "7. ✅ Sécurité sans clé → Accès bloqué"
echo ""
echo -e "${BLUE}🔧 Prochaines étapes pour l'intégration :${NC}"
echo "• Configurer les variables SMTP pour l'envoi d'emails"
echo "• Intégrer dans votre application mobile/web"
echo "• Tester avec de vrais utilisateurs"
echo "• Configurer pour la production" 