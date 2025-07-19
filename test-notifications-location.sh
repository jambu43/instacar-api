#!/bin/bash

# Script de test pour les notifications et la géolocalisation en temps réel
# API InstaCar - Notifications et Géolocalisation

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Test des Notifications et Géolocalisation - API InstaCar ===${NC}"
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

# Test 1: Créer un passager
echo -e "${YELLOW}1. Création d'un passager...${NC}"
PASSENGER_DATA='{
  "email": "passenger_notif_'$(date +%s)'@test.com",
  "name": "Jean Dupont",
  "phone": "+33123456789",
  "gender": "MALE"
}'

PASSENGER_RESPONSE=$(make_request "POST" "/users" "$PASSENGER_DATA" "201")
if [ $? -eq 0 ]; then
    PASSENGER_ID=$(echo "$PASSENGER_RESPONSE" | jq -r '.user.id')
    show_result "Création passager" "SUCCESS" "ID: $PASSENGER_ID"
else
    show_result "Création passager" "ERROR" "Échec de la création"
    exit 1
fi

# Test 2: Créer un véhicule
echo -e "${YELLOW}2. Création d'un véhicule...${NC}"
VEHICLE_DATA='{
  "brand": "Renault",
  "model": "Clio",
  "year": 2020,
  "color": "Blanc",
  "plateNumber": "AB-123-CD",
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE"
}'

VEHICLE_RESPONSE=$(make_request "POST" "/drivers/vehicles" "$VEHICLE_DATA" "201")
if [ $? -eq 0 ]; then
    VEHICLE_ID=$(echo "$VEHICLE_RESPONSE" | jq -r '.vehicle.id')
    show_result "Création véhicule" "SUCCESS" "ID: $VEHICLE_ID"
else
    show_result "Création véhicule" "ERROR" "Échec de la création"
    exit 1
fi

# Test 3: Créer un chauffeur
echo -e "${YELLOW}3. Création d'un chauffeur...${NC}"
DRIVER_DATA='{
  "userId": '$PASSENGER_ID',
  "licenseNumber": "LICENSE123",
  "vehicleId": '$VEHICLE_ID',
  "fullName": "Pierre Martin",
  "phone": "+33987654321"
}'

DRIVER_RESPONSE=$(make_request "POST" "/drivers" "$DRIVER_DATA" "201")
if [ $? -eq 0 ]; then
    DRIVER_ID=$(echo "$DRIVER_RESPONSE" | jq -r '.driver.id')
    show_result "Création chauffeur" "SUCCESS" "ID: $DRIVER_ID"
else
    show_result "Création chauffeur" "ERROR" "Échec de la création"
    exit 1
fi

# Test 4: Mettre à jour la disponibilité du chauffeur
echo -e "${YELLOW}4. Mise à jour de la disponibilité du chauffeur...${NC}"
AVAILABILITY_DATA='{
  "isAvailable": true,
  "currentLat": 48.8566,
  "currentLng": 2.3522
}'

AVAILABILITY_RESPONSE=$(make_request "PATCH" "/drivers/$DRIVER_ID/availability" "$AVAILABILITY_DATA" "200")
if [ $? -eq 0 ]; then
    show_result "Mise à jour disponibilité" "SUCCESS" "Chauffeur disponible"
else
    show_result "Mise à jour disponibilité" "ERROR" "Échec de la mise à jour"
fi

# Test 5: Créer une course
echo -e "${YELLOW}5. Création d'une course...${NC}"
RIDE_DATA='{
  "passengerId": '$PASSENGER_ID',
  "pickupLat": 48.8566,
  "pickupLng": 2.3522,
  "pickupAddress": "Tour Eiffel, Paris",
  "dropoffLat": 48.8606,
  "dropoffLng": 2.3376,
  "dropoffAddress": "Arc de Triomphe, Paris",
  "price": 15.50
}'

RIDE_RESPONSE=$(make_request "POST" "/rides" "$RIDE_DATA" "201")
if [ $? -eq 0 ]; then
    RIDE_ID=$(echo "$RIDE_RESPONSE" | jq -r '.ride.id')
    show_result "Création course" "SUCCESS" "ID: $RIDE_ID"
else
    show_result "Création course" "ERROR" "Échec de la création"
    exit 1
fi

# Test 6: Accepter la course
echo -e "${YELLOW}6. Acceptation de la course...${NC}"
ACCEPT_DATA='{
  "driverId": '$DRIVER_ID',
  "currentLat": 48.8566,
  "currentLng": 2.3522
}'

ACCEPT_RESPONSE=$(make_request "POST" "/rides/$RIDE_ID/accept" "$ACCEPT_DATA" "200")
if [ $? -eq 0 ]; then
    show_result "Acceptation course" "SUCCESS" "Course acceptée"
else
    show_result "Acceptation course" "ERROR" "Échec de l'acceptation"
fi

# Test 7: Mettre à jour la localisation du chauffeur
echo -e "${YELLOW}7. Mise à jour de la localisation du chauffeur...${NC}"
LOCATION_DATA='{
  "latitude": 48.8584,
  "longitude": 2.2945,
  "accuracy": 10,
  "speed": 25,
  "heading": 180
}'

LOCATION_RESPONSE=$(make_request "POST" "/location/driver/$DRIVER_ID/update" "$LOCATION_DATA" "201")
if [ $? -eq 0 ]; then
    show_result "Mise à jour localisation" "SUCCESS" "Localisation mise à jour"
else
    show_result "Mise à jour localisation" "ERROR" "Échec de la mise à jour"
fi

# Test 8: Récupérer la localisation actuelle du chauffeur
echo -e "${YELLOW}8. Récupération de la localisation actuelle...${NC}"
CURRENT_LOCATION_RESPONSE=$(make_request "GET" "/location/driver/$DRIVER_ID/current" "" "200")
if [ $? -eq 0 ]; then
    show_result "Localisation actuelle" "SUCCESS" "Localisation récupérée"
    echo "   Localisation: $(echo "$CURRENT_LOCATION_RESPONSE" | jq -r '.currentLat'), $(echo "$CURRENT_LOCATION_RESPONSE" | jq -r '.currentLng')"
else
    show_result "Localisation actuelle" "ERROR" "Échec de la récupération"
fi

# Test 9: Créer une notification
echo -e "${YELLOW}9. Création d'une notification...${NC}"
NOTIFICATION_DATA='{
  "userId": '$PASSENGER_ID',
  "type": "RIDE_ACCEPTED",
  "title": "Chauffeur trouvé !",
  "message": "Pierre Martin a accepté votre course. Il arrive dans quelques minutes.",
  "rideId": '$RIDE_ID',
  "driverId": '$DRIVER_ID'
}'

NOTIFICATION_RESPONSE=$(make_request "POST" "/notifications" "$NOTIFICATION_DATA" "201")
if [ $? -eq 0 ]; then
    NOTIFICATION_ID=$(echo "$NOTIFICATION_RESPONSE" | jq -r '.id')
    show_result "Création notification" "SUCCESS" "ID: $NOTIFICATION_ID"
else
    show_result "Création notification" "ERROR" "Échec de la création"
fi

# Test 10: Récupérer les notifications du passager
echo -e "${YELLOW}10. Récupération des notifications du passager...${NC}"
NOTIFICATIONS_RESPONSE=$(make_request "GET" "/notifications/user/$PASSENGER_ID" "" "200")
if [ $? -eq 0 ]; then
    NOTIFICATION_COUNT=$(echo "$NOTIFICATIONS_RESPONSE" | jq 'length')
    show_result "Récupération notifications" "SUCCESS" "$NOTIFICATION_COUNT notification(s)"
else
    show_result "Récupération notifications" "ERROR" "Échec de la récupération"
fi

# Test 11: Récupérer les notifications non lues
echo -e "${YELLOW}11. Récupération des notifications non lues...${NC}"
UNREAD_RESPONSE=$(make_request "GET" "/notifications/user/$PASSENGER_ID/unread" "" "200")
if [ $? -eq 0 ]; then
    UNREAD_COUNT=$(echo "$UNREAD_RESPONSE" | jq 'length')
    show_result "Notifications non lues" "SUCCESS" "$UNREAD_COUNT notification(s) non lue(s)"
else
    show_result "Notifications non lues" "ERROR" "Échec de la récupération"
fi

# Test 12: Marquer une notification comme lue
if [ -n "$NOTIFICATION_ID" ]; then
    echo -e "${YELLOW}12. Marquage d'une notification comme lue...${NC}"
    MARK_READ_RESPONSE=$(make_request "PATCH" "/notifications/$NOTIFICATION_ID/user/$PASSENGER_ID/read" "" "200")
    if [ $? -eq 0 ]; then
        show_result "Marquage comme lue" "SUCCESS" "Notification marquée comme lue"
    else
        show_result "Marquage comme lue" "ERROR" "Échec du marquage"
    fi
fi

# Test 13: Rechercher les chauffeurs à proximité
echo -e "${YELLOW}13. Recherche de chauffeurs à proximité...${NC}"
NEARBY_RESPONSE=$(make_request "GET" "/location/nearby-drivers?latitude=48.8566&longitude=2.3522&radius=5" "" "200")
if [ $? -eq 0 ]; then
    NEARBY_COUNT=$(echo "$NEARBY_RESPONSE" | jq 'length')
    show_result "Chauffeurs à proximité" "SUCCESS" "$NEARBY_COUNT chauffeur(s) trouvé(s)"
else
    show_result "Chauffeurs à proximité" "ERROR" "Échec de la recherche"
fi

# Test 14: Suivre la progression d'une course
echo -e "${YELLOW}14. Suivi de la progression de la course...${NC}"
TRACK_RESPONSE=$(make_request "GET" "/location/ride/$RIDE_ID/track" "" "200")
if [ $? -eq 0 ]; then
    show_result "Suivi course" "SUCCESS" "Progression récupérée"
    ETA=$(echo "$TRACK_RESPONSE" | jq -r '.eta.toPickup')
    echo "   ETA vers point de prise en charge: ${ETA} minutes"
else
    show_result "Suivi course" "ERROR" "Échec du suivi"
fi

# Test 15: Calculer l'ETA
echo -e "${YELLOW}15. Calcul du temps d'arrivée estimé...${NC}"
ETA_RESPONSE=$(make_request "GET" "/location/eta/driver/$DRIVER_ID?destinationLat=48.8606&destinationLng=2.3376" "" "200")
if [ $? -eq 0 ]; then
    ETA_TIME=$(echo "$ETA_RESPONSE")
    show_result "Calcul ETA" "SUCCESS" "${ETA_TIME} minutes"
else
    show_result "Calcul ETA" "ERROR" "Échec du calcul"
fi

# Test 16: Mettre à jour le statut de la course
echo -e "${YELLOW}16. Mise à jour du statut de la course...${NC}"
STATUS_DATA='{
  "status": "ARRIVING"
}'

STATUS_RESPONSE=$(make_request "PATCH" "/rides/$RIDE_ID/status" "$STATUS_DATA" "200")
if [ $? -eq 0 ]; then
    show_result "Mise à jour statut" "SUCCESS" "Statut mis à jour vers ARRIVING"
else
    show_result "Mise à jour statut" "ERROR" "Échec de la mise à jour"
fi

# Test 17: Récupérer l'historique des localisations
echo -e "${YELLOW}17. Récupération de l'historique des localisations...${NC}"
HISTORY_RESPONSE=$(make_request "GET" "/location/driver/$DRIVER_ID/history?limit=5" "" "200")
if [ $? -eq 0 ]; then
    HISTORY_COUNT=$(echo "$HISTORY_RESPONSE" | jq 'length')
    show_result "Historique localisations" "SUCCESS" "$HISTORY_COUNT entrée(s)"
else
    show_result "Historique localisations" "ERROR" "Échec de la récupération"
fi

echo ""
echo -e "${BLUE}=== Résumé des tests ===${NC}"
echo -e "${GREEN}Tests terminés avec succès !${NC}"
echo ""
echo -e "${YELLOW}Données créées :${NC}"
echo "  - Passager ID: $PASSENGER_ID"
echo "  - Véhicule ID: $VEHICLE_ID"
echo "  - Chauffeur ID: $DRIVER_ID"
echo "  - Course ID: $RIDE_ID"
if [ -n "$NOTIFICATION_ID" ]; then
    echo "  - Notification ID: $NOTIFICATION_ID"
fi
echo ""
echo -e "${BLUE}Pour tester les WebSockets, connectez-vous à :${NC}"
echo "  ws://localhost:3000"
echo ""
echo -e "${BLUE}Événements WebSocket disponibles :${NC}"
echo "  - authenticate: { userId: $PASSENGER_ID, userType: 'passenger' }"
echo "  - join-ride: { rideId: $RIDE_ID }"
echo "  - driver-location-update: { driverId: $DRIVER_ID, latitude: 48.8584, longitude: 2.2945 }"
echo "" 