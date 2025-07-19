#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000/api"
APP_KEY="instacar-secret-key-2024"
EMAIL="test_otp_$(date +%s)@test.com"
NAME="Test User OTP"
PHONE="+33123456789"
GENDER="MALE"

echo "🚀 Test du système d'authentification par OTP"
echo "=============================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        echo "Réponse: $3"
    fi
}

echo -e "\n${YELLOW}1. Test de demande d'OTP pour nouvel utilisateur${NC}"
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
    print_result 0 "Demande OTP réussie pour nouvel utilisateur"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Échec de la demande OTP" "$RESPONSE"
fi

echo -e "\n${YELLOW}2. Test de demande d'OTP pour utilisateur existant${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"$EMAIL\"
  }")

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_result 0 "Demande OTP réussie pour utilisateur existant"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Échec de la demande OTP" "$RESPONSE"
fi

echo -e "\n${YELLOW}3. Test de renvoi d'OTP (doit échouer - trop rapide)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/resend-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"$EMAIL\"
  }")

if echo "$RESPONSE" | grep -q "Veuillez attendre"; then
    print_result 0 "Renvoi OTP correctement bloqué (trop rapide)"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Renvoi OTP non bloqué comme attendu" "$RESPONSE"
fi

echo -e "\n${YELLOW}4. Test de vérification OTP avec code invalide${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"$EMAIL\",
    \"otpCode\": \"000000\"
  }")

if echo "$RESPONSE" | grep -q "Code OTP invalide"; then
    print_result 0 "Vérification OTP correctement rejetée (code invalide)"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Vérification OTP acceptée avec code invalide" "$RESPONSE"
fi

echo -e "\n${YELLOW}5. Test d'accès au profil sans token${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY")

if echo "$RESPONSE" | grep -q "Token d'authentification manquant"; then
    print_result 0 "Accès au profil correctement bloqué (pas de token)"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Accès au profil autorisé sans token" "$RESPONSE"
fi

echo -e "\n${YELLOW}6. Test de déconnexion sans token${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY")

if echo "$RESPONSE" | grep -q "Token d'authentification manquant"; then
    print_result 0 "Déconnexion correctement bloquée (pas de token)"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Déconnexion autorisée sans token" "$RESPONSE"
fi

echo -e "\n${YELLOW}7. Test de refresh token avec token invalide${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"refreshToken\": \"invalid-token\"
  }")

if echo "$RESPONSE" | grep -q "Refresh token invalide"; then
    print_result 0 "Refresh token correctement rejeté (token invalide)"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Refresh token accepté avec token invalide" "$RESPONSE"
fi

echo -e "\n${YELLOW}8. Test de demande OTP sans clé d'application${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\"
  }")

if echo "$RESPONSE" | grep -q "Clé d'application manquante"; then
    print_result 0 "Demande OTP correctement bloquée (pas de clé d'app)"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Demande OTP autorisée sans clé d'application" "$RESPONSE"
fi

echo -e "\n${YELLOW}9. Test de demande OTP avec clé d'application invalide${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: invalid-key" \
  -d "{
    \"email\": \"$EMAIL\"
  }")

if echo "$RESPONSE" | grep -q "Clé d'application invalide"; then
    print_result 0 "Demande OTP correctement bloquée (clé invalide)"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Demande OTP autorisée avec clé invalide" "$RESPONSE"
fi

echo -e "\n${YELLOW}10. Test de validation des données d'entrée${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"invalid-email\"
  }")

if echo "$RESPONSE" | grep -q "email must be an email"; then
    print_result 0 "Validation email correctement appliquée"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Validation email non appliquée" "$RESPONSE"
fi

echo -e "\n${YELLOW}11. Test de demande OTP avec email manquant${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{}")

if echo "$RESPONSE" | grep -q "email should not be empty"; then
    print_result 0 "Validation email manquant correctement appliquée"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Validation email manquant non appliquée" "$RESPONSE"
fi

echo -e "\n${YELLOW}12. Test de vérification OTP avec données manquantes${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"$EMAIL\"
  }")

if echo "$RESPONSE" | grep -q "otpCode should not be empty"; then
    print_result 0 "Validation OTP manquant correctement appliquée"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Validation OTP manquant non appliquée" "$RESPONSE"
fi

echo -e "\n${YELLOW}13. Test de vérification OTP avec email invalide${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"invalid-email\",
    \"otpCode\": \"123456\"
  }")

if echo "$RESPONSE" | grep -q "email must be an email"; then
    print_result 0 "Validation email invalide correctement appliquée"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Validation email invalide non appliquée" "$RESPONSE"
fi

echo -e "\n${YELLOW}14. Test de vérification OTP pour utilisateur inexistant${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"nonexistent@test.com\",
    \"otpCode\": \"123456\"
  }")

if echo "$RESPONSE" | grep -q "Utilisateur non trouvé"; then
    print_result 0 "Vérification OTP correctement rejetée (utilisateur inexistant)"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Vérification OTP acceptée pour utilisateur inexistant" "$RESPONSE"
fi

echo -e "\n${YELLOW}15. Test de renvoi OTP pour utilisateur inexistant${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/resend-otp" \
  -H "Content-Type: application/json" \
  -H "instakey: $APP_KEY" \
  -d "{
    \"email\": \"nonexistent@test.com\"
  }")

if echo "$RESPONSE" | grep -q "Utilisateur non trouvé"; then
    print_result 0 "Renvoi OTP correctement rejeté (utilisateur inexistant)"
    echo "Réponse: $RESPONSE"
else
    print_result 1 "Renvoi OTP accepté pour utilisateur inexistant" "$RESPONSE"
fi

echo -e "\n${GREEN}🎉 Tests du système d'authentification par OTP terminés !${NC}"
echo -e "${YELLOW}Note: Pour tester la vérification OTP avec un vrai code, consultez les logs de l'application.${NC}" 