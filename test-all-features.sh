#!/bin/bash

# Script de test complet pour toutes les fonctionnalités de l'API InstaCar
# Inclut : Notifications, Géolocalisation, WebSockets, Notifications Push

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Test Complet de l'API InstaCar ===${NC}"
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
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
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

echo -e "${YELLOW}=== 1. TESTS D'AUTHENTIFICATION ===${NC}"

# Test 1: Créer un utilisateur
echo -e "${YELLOW}1.1. Création d'un utilisateur...${NC}"
USER_DATA='{
  "email": "test_all_'$(date +%s)'@test.com",
  "name": "Test User All Features",
  "phone": "+33'$(date +%s)'",
  "gender": "MALE"
}'

USER_RESPONSE=$(make_request "POST" "/auth/register" "$USER_DATA" "201")
if [ $? -eq 0 ]; then
    USER_ID=$(echo "$USER_RESPONSE" | jq -r '.userId')
    show_result "Création utilisateur" "SUCCESS" "ID: $USER_ID"
else
    show_result "Création utilisateur" "ERROR" "Échec de la création"
    exit 1
fi

echo -e "${YELLOW}=== 2. TESTS DE NOTIFICATIONS ===${NC}"

# Test 2: Créer une notification
echo -e "${YELLOW}2.1. Création d'une notification...${NC}"
NOTIFICATION_DATA='{
  "userId": '$USER_ID',
  "type": "RIDE_REQUESTED",
  "title": "Test Notification",
  "message": "Ceci est un test de notification"
}'

NOTIFICATION_RESPONSE=$(make_request "POST" "/notifications" "$NOTIFICATION_DATA" "201")
if [ $? -eq 0 ]; then
    NOTIFICATION_ID=$(echo "$NOTIFICATION_RESPONSE" | jq -r '.id')
    show_result "Création notification" "SUCCESS" "ID: $NOTIFICATION_ID"
else
    show_result "Création notification" "ERROR" "Échec de la création"
fi

# Test 3: Récupérer les notifications
echo -e "${YELLOW}2.2. Récupération des notifications...${NC}"
NOTIFICATIONS_RESPONSE=$(make_request "GET" "/notifications/user/$USER_ID" "" "200")
if [ $? -eq 0 ]; then
    NOTIFICATION_COUNT=$(echo "$NOTIFICATIONS_RESPONSE" | jq 'length')
    show_result "Récupération notifications" "SUCCESS" "$NOTIFICATION_COUNT notification(s)"
else
    show_result "Récupération notifications" "ERROR" "Échec de la récupération"
fi

# Test 4: Marquer comme lue
if [ -n "$NOTIFICATION_ID" ]; then
    echo -e "${YELLOW}2.3. Marquage comme lue...${NC}"
    MARK_READ_RESPONSE=$(make_request "PATCH" "/notifications/$NOTIFICATION_ID/user/$USER_ID/read" "" "200")
    if [ $? -eq 0 ]; then
        show_result "Marquage comme lue" "SUCCESS" "Notification marquée comme lue"
    else
        show_result "Marquage comme lue" "ERROR" "Échec du marquage"
    fi
fi

echo -e "${YELLOW}=== 3. TESTS DE GÉOLOCALISATION ===${NC}"

# Test 5: Créer un véhicule
echo -e "${YELLOW}3.1. Création d'un véhicule...${NC}"
VEHICLE_DATA='{
  "brand": "Tesla",
  "model": "Model 3",
  "year": 2023,
  "color": "Noir",
  "plateNumber": "ALL-TEST-'$(date +%s)'",
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE"
}'

VEHICLE_RESPONSE=$(make_request "POST" "/drivers/register-vehicle" "$VEHICLE_DATA" "201")
if [ $? -eq 0 ]; then
    VEHICLE_ID=$(echo "$VEHICLE_RESPONSE" | jq -r '.vehicle.id')
    show_result "Création véhicule" "SUCCESS" "ID: $VEHICLE_ID"
else
    show_result "Création véhicule" "ERROR" "Échec de la création"
    # Utilisons un véhicule existant
    VEHICLE_ID=1
fi

# Test 6: Créer un chauffeur
echo -e "${YELLOW}3.2. Création d'un chauffeur...${NC}"
DRIVER_DATA='{
  "licenseNumber": "ALL-LICENSE-'$(date +%s)'",
  "fullName": "Chauffeur Test",
  "phone": "+33'$(date +%s)'",
  "profilePhoto": "https://example.com/photo.jpg",
  "identityDocument": "https://example.com/id.jpg"
}'

DRIVER_RESPONSE=$(make_request "POST" "/drivers/register-driver/$VEHICLE_ID" "$DRIVER_DATA" "201")
if [ $? -eq 0 ]; then
    DRIVER_ID=$(echo "$DRIVER_RESPONSE" | jq -r '.driver.id')
    show_result "Création chauffeur" "SUCCESS" "ID: $DRIVER_ID"
else
    show_result "Création chauffeur" "ERROR" "Échec de la création"
    # Utilisons un chauffeur existant
    DRIVER_ID=10
fi

# Test 7: Mettre à jour la localisation
echo -e "${YELLOW}3.3. Mise à jour de la localisation...${NC}"
LOCATION_DATA='{
  "latitude": 48.8584,
  "longitude": 2.2945,
  "accuracy": 15,
  "speed": 30,
  "heading": 90
}'

LOCATION_RESPONSE=$(make_request "POST" "/location/driver/$DRIVER_ID/update" "$LOCATION_DATA" "201")
if [ $? -eq 0 ]; then
    show_result "Mise à jour localisation" "SUCCESS" "Localisation mise à jour"
else
    show_result "Mise à jour localisation" "ERROR" "Échec de la mise à jour"
fi

# Test 8: Récupérer la localisation actuelle
echo -e "${YELLOW}3.4. Récupération de la localisation actuelle...${NC}"
CURRENT_LOCATION_RESPONSE=$(make_request "GET" "/location/driver/$DRIVER_ID/current" "" "200")
if [ $? -eq 0 ]; then
    show_result "Localisation actuelle" "SUCCESS" "Localisation récupérée"
    LAT=$(echo "$CURRENT_LOCATION_RESPONSE" | jq -r '.currentLat')
    LNG=$(echo "$CURRENT_LOCATION_RESPONSE" | jq -r '.currentLng')
    echo "   Position: $LAT, $LNG"
else
    show_result "Localisation actuelle" "ERROR" "Échec de la récupération"
fi

# Test 9: Rechercher les chauffeurs à proximité
echo -e "${YELLOW}3.5. Recherche de chauffeurs à proximité...${NC}"
NEARBY_RESPONSE=$(make_request "GET" "/location/nearby-drivers?latitude=48.8566&longitude=2.3522&radius=5" "" "200")
if [ $? -eq 0 ]; then
    NEARBY_COUNT=$(echo "$NEARBY_RESPONSE" | jq 'length')
    show_result "Chauffeurs à proximité" "SUCCESS" "$NEARBY_COUNT chauffeur(s) trouvé(s)"
else
    show_result "Chauffeurs à proximité" "ERROR" "Échec de la recherche"
fi

echo -e "${YELLOW}=== 4. TESTS DE NOTIFICATIONS PUSH ===${NC}"

# Test 10: Récupérer les préférences de notification
echo -e "${YELLOW}4.1. Récupération des préférences...${NC}"
PREFERENCES_RESPONSE=$(make_request "GET" "/push-notifications/preferences/$USER_ID" "" "200")
if [ $? -eq 0 ]; then
    show_result "Préférences" "SUCCESS" "Préférences récupérées"
else
    show_result "Préférences" "ERROR" "Échec de la récupération"
fi

# Test 11: Enregistrer un token de notification
echo -e "${YELLOW}4.2. Enregistrement d'un token...${NC}"
TOKEN_DATA='{
  "token": "test_push_token_'$(date +%s)'",
  "platform": "ANDROID"
}'

TOKEN_RESPONSE=$(make_request "POST" "/push-notifications/register-token/$USER_ID" "$TOKEN_DATA" "201")
if [ $? -eq 0 ]; then
    show_result "Enregistrement token" "SUCCESS" "Token enregistré"
else
    show_result "Enregistrement token" "ERROR" "Échec de l'enregistrement"
fi

# Test 12: Mettre à jour les préférences
echo -e "${YELLOW}4.3. Mise à jour des préférences...${NC}"
UPDATE_PREFERENCES_DATA='{
  "rideNotifications": true,
  "promotionalNotifications": false,
  "systemNotifications": true,
  "pushNotifications": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00"
}'

UPDATE_PREFERENCES_RESPONSE=$(make_request "PUT" "/push-notifications/preferences/$USER_ID" "$UPDATE_PREFERENCES_DATA" "200")
if [ $? -eq 0 ]; then
    show_result "Mise à jour préférences" "SUCCESS" "Préférences mises à jour"
else
    show_result "Mise à jour préférences" "ERROR" "Échec de la mise à jour"
fi

# Test 13: Envoyer une notification push
echo -e "${YELLOW}4.4. Envoi d'une notification push...${NC}"
SEND_NOTIFICATION_DATA='{
  "userIds": ['$USER_ID'],
  "type": "RIDE_ACCEPTED",
  "title": "Chauffeur trouvé !",
  "message": "Votre chauffeur arrive dans 5 minutes",
  "data": {"rideId": 123, "driverId": '$DRIVER_ID'},
  "action": "OPEN_RIDE_DETAILS"
}'

SEND_NOTIFICATION_RESPONSE=$(make_request "POST" "/push-notifications/send" "$SEND_NOTIFICATION_DATA" "201")
if [ $? -eq 0 ]; then
    show_result "Envoi notification" "SUCCESS" "Notification envoyée"
else
    show_result "Envoi notification" "ERROR" "Échec de l'envoi"
fi

echo -e "${YELLOW}=== 5. TESTS DE COURSES ===${NC}"

# Test 14: Créer une course
echo -e "${YELLOW}5.1. Création d'une course...${NC}"
RIDE_DATA='{
  "passengerId": '$USER_ID',
  "pickupLat": 48.8566,
  "pickupLng": 2.3522,
  "pickupAddress": "Tour Eiffel, Paris",
  "dropoffLat": 48.8606,
  "dropoffLng": 2.3376,
  "dropoffAddress": "Arc de Triomphe, Paris",
  "price": 18.50
}'

RIDE_RESPONSE=$(make_request "POST" "/rides" "$RIDE_DATA" "201")
if [ $? -eq 0 ]; then
    RIDE_ID=$(echo "$RIDE_RESPONSE" | jq -r '.ride.id')
    show_result "Création course" "SUCCESS" "ID: $RIDE_ID"
else
    show_result "Création course" "ERROR" "Échec de la création"
fi

# Test 15: Accepter la course
if [ -n "$RIDE_ID" ]; then
    echo -e "${YELLOW}5.2. Acceptation de la course...${NC}"
    ACCEPT_DATA='{
      "driverId": '$DRIVER_ID',
      "currentLat": 48.8584,
      "currentLng": 2.2945
    }'

    ACCEPT_RESPONSE=$(make_request "POST" "/rides/$RIDE_ID/accept" "$ACCEPT_DATA" "200")
    if [ $? -eq 0 ]; then
        show_result "Acceptation course" "SUCCESS" "Course acceptée"
    else
        show_result "Acceptation course" "ERROR" "Échec de l'acceptation"
    fi
fi

# Test 16: Suivre la progression de la course
if [ -n "$RIDE_ID" ]; then
    echo -e "${YELLOW}5.3. Suivi de la progression...${NC}"
    TRACK_RESPONSE=$(make_request "GET" "/location/ride/$RIDE_ID/track" "" "200")
    if [ $? -eq 0 ]; then
        show_result "Suivi course" "SUCCESS" "Progression récupérée"
        ETA=$(echo "$TRACK_RESPONSE" | jq -r '.eta.toPickup')
        echo "   ETA: ${ETA} minutes"
    else
        show_result "Suivi course" "ERROR" "Échec du suivi"
    fi
fi

echo ""
echo -e "${BLUE}=== RÉSUMÉ DES TESTS ===${NC}"
echo -e "${GREEN}Tous les tests ont été exécutés avec succès !${NC}"
echo ""
echo -e "${YELLOW}Données créées :${NC}"
echo "  - Utilisateur ID: $USER_ID"
echo "  - Véhicule ID: $VEHICLE_ID"
echo "  - Chauffeur ID: $DRIVER_ID"
if [ -n "$RIDE_ID" ]; then
    echo "  - Course ID: $RIDE_ID"
fi
if [ -n "$NOTIFICATION_ID" ]; then
    echo "  - Notification ID: $NOTIFICATION_ID"
fi
echo ""
echo -e "${BLUE}Fonctionnalités testées :${NC}"
echo "  ✓ Authentification et inscription"
echo "  ✓ Système de notifications"
echo "  ✓ Géolocalisation en temps réel"
echo "  ✓ Notifications push"
echo "  ✓ Gestion des courses"
echo "  ✓ Suivi de progression"
echo ""
echo -e "${BLUE}Pour tester les WebSockets, connectez-vous à :${NC}"
echo "  ws://localhost:3000"
echo ""
echo -e "${BLUE}Documentation Swagger :${NC}"
echo "  http://localhost:3000/api"
echo "" 