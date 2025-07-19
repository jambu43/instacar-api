#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000/api"
APP_KEY="instacar-secret-key-2024"

echo "🚀 Test du Système d'Inscription Complet - InstaCar API"
echo "========================================================"
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

echo -e "${BLUE}📝 Test 1: Inscription d'un nouvel utilisateur${NC}"
echo "Endpoint: POST /auth/register-user"
echo ""

USER_EMAIL="user_$(date +%s)@example.com"
USER_NAME="Test User"
USER_PHONE="+33123456789"

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register-user" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"name\": \"$USER_NAME\",
    \"phone\": \"$USER_PHONE\",
    \"gender\": \"MALE\"
  }")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Inscription utilisateur réussie"
    echo "Réponse: $RESPONSE"
    
    # Extraire le code OTP et l'ID utilisateur
    OTP_CODE=$(extract_json_value "$RESPONSE" "otpCode")
    USER_ID=$(echo "$RESPONSE" | grep -o "\"userId\":[0-9]*" | cut -d':' -f2)
    
    echo -e "${YELLOW}🔐 Code OTP: $OTP_CODE${NC}"
    echo -e "${YELLOW}👤 User ID: $USER_ID${NC}"
else
    print_result 1 "❌ Échec de l'inscription utilisateur"
    echo "Erreur: $RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}🔐 Test 2: Vérification OTP pour l'utilisateur${NC}"
echo "Endpoint: POST /auth/verify-otp"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"otpCode\": \"$OTP_CODE\"
  }")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Vérification OTP réussie"
    echo "Réponse: $RESPONSE"
    
    # Extraire les tokens
    ACCESS_TOKEN=$(extract_json_value "$RESPONSE" "accessToken")
    REFRESH_TOKEN=$(extract_json_value "$RESPONSE" "refreshToken")
    
    echo -e "${YELLOW}🎫 Access Token: ${ACCESS_TOKEN:0:50}...${NC}"
    echo -e "${YELLOW}🔄 Refresh Token: ${REFRESH_TOKEN:0:50}...${NC}"
else
    print_result 1 "❌ Échec de la vérification OTP"
    echo "Erreur: $RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}🚗 Test 3: Inscription d'un nouveau chauffeur${NC}"
echo "Endpoint: POST /auth/register-driver"
echo ""

DRIVER_PHONE="+33987654321"
DRIVER_NAME="Test Driver"
LICENSE_NUMBER="123456789"
PLATE_NUMBER="AB-123-CD"

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register-driver" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"brand\": \"Toyota\",
    \"model\": \"Corolla\",
    \"year\": 2020,
    \"color\": \"Blanc\",
    \"plateNumber\": \"$PLATE_NUMBER\",
    \"capacity\": 4,
    \"city\": \"Paris\",
    \"vehicleType\": \"PROPRIETAIRE\",
    \"licenseNumber\": \"$LICENSE_NUMBER\",
    \"fullName\": \"$DRIVER_NAME\",
    \"phone\": \"$DRIVER_PHONE\"
  }")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Inscription chauffeur réussie"
    echo "Réponse: $RESPONSE"
    
    # Extraire les informations
    DRIVER_OTP_CODE=$(extract_json_value "$RESPONSE" "otpCode")
    DRIVER_USER_ID=$(echo "$RESPONSE" | grep -o "\"userId\":[0-9]*" | cut -d':' -f2)
    DRIVER_ID=$(echo "$RESPONSE" | grep -o "\"driverId\":[0-9]*" | cut -d':' -f2)
    VEHICLE_ID=$(echo "$RESPONSE" | grep -o "\"vehicleId\":[0-9]*" | cut -d':' -f2)
    
    echo -e "${YELLOW}🔐 Code OTP Chauffeur: $DRIVER_OTP_CODE${NC}"
    echo -e "${YELLOW}👤 Driver User ID: $DRIVER_USER_ID${NC}"
    echo -e "${YELLOW}🚗 Driver ID: $DRIVER_ID${NC}"
    echo -e "${YELLOW}🚙 Vehicle ID: $VEHICLE_ID${NC}"
else
    print_result 1 "❌ Échec de l'inscription chauffeur"
    echo "Erreur: $RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}🔐 Test 4: Vérification OTP pour le chauffeur${NC}"
echo "Endpoint: POST /auth/verify-otp"
echo ""

DRIVER_EMAIL="${DRIVER_PHONE}@driver.instacar.com"

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"$DRIVER_EMAIL\",
    \"otpCode\": \"$DRIVER_OTP_CODE\"
  }")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Vérification OTP chauffeur réussie"
    echo "Réponse: $RESPONSE"
    
    # Extraire les tokens du chauffeur
    DRIVER_ACCESS_TOKEN=$(extract_json_value "$RESPONSE" "accessToken")
    DRIVER_REFRESH_TOKEN=$(extract_json_value "$RESPONSE" "refreshToken")
    
    echo -e "${YELLOW}🎫 Driver Access Token: ${DRIVER_ACCESS_TOKEN:0:50}...${NC}"
    echo -e "${YELLOW}🔄 Driver Refresh Token: ${DRIVER_REFRESH_TOKEN:0:50}...${NC}"
else
    print_result 1 "❌ Échec de la vérification OTP chauffeur"
    echo "Erreur: $RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}📧 Test 5: Demande OTP pour connexion (utilisateur existant)${NC}"
echo "Endpoint: POST /auth/request-otp"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"$USER_EMAIL\"
  }")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Demande OTP pour connexion réussie"
    echo "Réponse: $RESPONSE"
    
    # Extraire le nouveau code OTP
    NEW_OTP_CODE=$(extract_json_value "$RESPONSE" "otpCode")
    echo -e "${YELLOW}🔐 Nouveau Code OTP: $NEW_OTP_CODE${NC}"
else
    print_result 1 "❌ Échec de la demande OTP pour connexion"
    echo "Erreur: $RESPONSE"
fi

echo ""
echo -e "${BLUE}👤 Test 6: Accès au profil utilisateur${NC}"
echo "Endpoint: GET /auth/profile"
echo ""

RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Accès au profil utilisateur réussi"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "❌ Échec de l'accès au profil utilisateur"
    echo "Erreur: $RESPONSE"
fi

echo ""
echo -e "${BLUE}🚗 Test 7: Accès au profil chauffeur${NC}"
echo "Endpoint: GET /auth/profile"
echo ""

RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -H "Authorization: Bearer $DRIVER_ACCESS_TOKEN")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "✅ Accès au profil chauffeur réussi"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "❌ Échec de l'accès au profil chauffeur"
    echo "Erreur: $RESPONSE"
fi

echo ""
echo -e "${BLUE}🛡️ Test 8: Test de sécurité - Demande OTP pour utilisateur inexistant${NC}"
echo "Endpoint: POST /auth/request-otp"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"nonexistent@example.com\"
  }")

if echo "$RESPONSE" | grep -q "Aucun compte trouvé"; then
    print_result 0 "✅ Sécurité: Demande OTP correctement rejetée pour utilisateur inexistant"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "❌ Problème de sécurité: Demande OTP autorisée pour utilisateur inexistant"
    echo "Réponse: $RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 Tests du système d'inscription complet terminés !${NC}"
echo ""
echo -e "${YELLOW}📋 Résumé du nouveau flux d'inscription :${NC}"
echo "1. ✅ Inscription utilisateur → Création compte temporaire + OTP"
echo "2. ✅ Vérification OTP utilisateur → Authentification + activation"
echo "3. ✅ Inscription chauffeur → Création utilisateur + véhicule + chauffeur + OTP"
echo "4. ✅ Vérification OTP chauffeur → Authentification + activation chauffeur"
echo "5. ✅ Connexion utilisateur existant → OTP pour connexion"
echo "6. ✅ Accès profil utilisateur → Authentification JWT"
echo "7. ✅ Accès profil chauffeur → Authentification JWT"
echo "8. ✅ Sécurité → Protection contre utilisateurs inexistants"
echo ""
echo -e "${BLUE}🔧 Avantages du nouveau système :${NC}"
echo "• Inscription complète séparée de l'authentification"
echo "• Support des rôles utilisateur et chauffeur"
echo "• Création automatique des véhicules pour les chauffeurs"
echo "• Vérification email obligatoire via OTP"
echo "• Sécurité renforcée sans mots de passe"
echo "• Flexibilité pour compléter l'inscription plus tard" 