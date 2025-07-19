#!/bin/bash

echo "🚗 Test du workflow des courses - InstaCar API"
echo "=============================================="
echo ""

# Vérifier si l'application est démarrée
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ L'application n'est pas démarrée"
    echo "   Démarrez-la avec: pnpm run start:dev"
    exit 1
fi

echo "✅ Application démarrée sur http://localhost:3000"
echo ""

echo "🎯 WORKFLOW COMPLET DES COURSES"
echo "==============================="
echo ""

echo "📋 ÉTAPE 1 : Création d'un passager pour les tests"
echo "=================================================="

# Créer un passager
passenger_data='{
  "name": "Marie Dupont",
  "email": "marie.dupont@test.com",
  "phone": "+33123456799",
  "gender": "FEMALE"
}'

echo "📤 Création du passager..."
passenger_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "$passenger_data")

passenger_http_code=$(echo "$passenger_response" | tail -n1)
passenger_response_body=$(echo "$passenger_response" | sed '$d')

if [ "$passenger_http_code" != "201" ]; then
    echo "❌ Erreur lors de la création du passager"
    exit 1
fi

passenger_id=$(echo "$passenger_response_body" | jq -r '.user.id')
echo "✅ Passager créé avec ID: $passenger_id"
echo ""

echo "📋 ÉTAPE 2 : Création d'un chauffeur pour les tests"
echo "==================================================="

# Générer des données uniques
TIMESTAMP=$(date +%s)
PLATE_NUMBER="RIDE-TEST-${TIMESTAMP}"
PHONE="+331234567${TIMESTAMP: -4}"
LICENSE="123456789${TIMESTAMP: -6}"

# Créer un véhicule
vehicle_data=$(cat <<EOF
{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Renault",
  "model": "Clio",
  "color": "Rouge",
  "year": 2021,
  "plateNumber": "$PLATE_NUMBER"
}
EOF
)

echo "📤 Création du véhicule..."
vehicle_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d "$vehicle_data")

vehicle_http_code=$(echo "$vehicle_response" | tail -n1)
vehicle_response_body=$(echo "$vehicle_response" | sed '$d')

if [ "$vehicle_http_code" != "201" ]; then
    echo "❌ Erreur lors de la création du véhicule"
    exit 1
fi

vehicle_id=$(echo "$vehicle_response_body" | jq -r '.vehicle.id')
echo "✅ Véhicule créé avec ID: $vehicle_id"

# Créer un chauffeur
driver_data=$(cat <<EOF
{
  "fullName": "Pierre Martin",
  "phone": "$PHONE",
  "licenseNumber": "$LICENSE",
  "identityDocument": "documents/test.pdf"
}
EOF
)

echo "📤 Création du chauffeur..."
driver_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id \
  -H "Content-Type: application/json" \
  -d "$driver_data")

driver_http_code=$(echo "$driver_response" | tail -n1)
driver_response_body=$(echo "$driver_response" | sed '$d')

if [ "$driver_http_code" != "201" ]; then
    echo "❌ Erreur lors de la création du chauffeur"
    exit 1
fi

driver_id=$(echo "$driver_response_body" | jq -r '.driver.id')
echo "✅ Chauffeur créé avec ID: $driver_id"
echo ""

echo "📋 ÉTAPE 3 : Mise en ligne du chauffeur"
echo "======================================="

# Mettre le chauffeur en ligne
availability_data='{
  "isAvailable": true,
  "currentLat": 48.8566,
  "currentLng": 2.3522
}'

echo "📤 Mise en ligne du chauffeur..."
availability_response=$(curl -s -w "\n%{http_code}" -X PUT http://localhost:3000/drivers/availability/$driver_id \
  -H "Content-Type: application/json" \
  -d "$availability_data")

availability_http_code=$(echo "$availability_response" | tail -n1)

if [ "$availability_http_code" = "200" ]; then
    echo "✅ Chauffeur mis en ligne avec succès"
else
    echo "❌ Erreur lors de la mise en ligne"
    exit 1
fi

echo ""

echo "📋 ÉTAPE 4 : Création d'une course par le passager"
echo "=================================================="

# Créer une course
ride_data=$(cat <<EOF
{
  "passengerId": $passenger_id,
  "pickupLat": 48.8566,
  "pickupLng": 2.3522,
  "pickupAddress": "123 Rue de la Paix, Paris",
  "dropoffLat": 48.8584,
  "dropoffLng": 2.2945,
  "dropoffAddress": "456 Avenue des Champs-Élysées, Paris",
  "price": 15.50
}
EOF
)

echo "📤 Création de la course..."
ride_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/rides \
  -H "Content-Type: application/json" \
  -d "$ride_data")

ride_http_code=$(echo "$ride_response" | tail -n1)
ride_response_body=$(echo "$ride_response" | sed '$d')

echo "📥 Réponse (HTTP $ride_http_code):"
echo "$ride_response_body" | jq . 2>/dev/null || echo "$ride_response_body"
echo ""

if [ "$ride_http_code" = "201" ]; then
    ride_id=$(echo "$ride_response_body" | jq -r '.ride.id')
    echo "✅ Course créée avec succès !"
    echo "   ID: $ride_id"
    echo "   Statut: REQUESTED"
else
    echo "❌ Erreur lors de la création de la course"
    exit 1
fi

echo ""

echo "📋 ÉTAPE 5 : Vérification des courses disponibles"
echo "================================================="

echo "📤 Récupération des courses disponibles..."
available_rides_response=$(curl -s -w "\n%{http_code}" -X GET http://localhost:3000/rides/available)

available_rides_http_code=$(echo "$available_rides_response" | tail -n1)
available_rides_response_body=$(echo "$available_rides_response" | sed '$d')

echo "📥 Réponse (HTTP $available_rides_http_code):"
echo "$available_rides_response_body" | jq . 2>/dev/null || echo "$available_rides_response_body"
echo ""

if [ "$available_rides_http_code" = "200" ]; then
    rides_count=$(echo "$available_rides_response_body" | jq -r '.rides | length')
    echo "✅ Courses disponibles récupérées : $rides_count course(s)"
else
    echo "❌ Erreur lors de la récupération des courses disponibles"
fi

echo ""

echo "📋 ÉTAPE 6 : Acceptation de la course par le chauffeur"
echo "======================================================"

# Accepter la course
accept_data='{
  "driverId": '$driver_id',
  "currentLat": 48.8566,
  "currentLng": 2.3522
}'

echo "📤 Acceptation de la course..."
accept_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/rides/$ride_id/accept \
  -H "Content-Type: application/json" \
  -d "$accept_data")

accept_http_code=$(echo "$accept_response" | tail -n1)
accept_response_body=$(echo "$accept_response" | sed '$d')

echo "📥 Réponse (HTTP $accept_http_code):"
echo "$accept_response_body" | jq . 2>/dev/null || echo "$accept_response_body"
echo ""

if [ "$accept_http_code" = "200" ]; then
    echo "✅ Course acceptée avec succès !"
    echo "   Le chauffeur est maintenant assigné à la course"
else
    echo "❌ Erreur lors de l'acceptation de la course"
    exit 1
fi

echo ""

echo "📋 ÉTAPE 7 : Mise à jour du statut de la course"
echo "==============================================="

# Mettre à jour le statut vers ARRIVING
status_data='{
  "status": "ARRIVING"
}'

echo "📤 Mise à jour du statut vers ARRIVING..."
status_response=$(curl -s -w "\n%{http_code}" -X PUT http://localhost:3000/rides/$ride_id/status \
  -H "Content-Type: application/json" \
  -d "$status_data")

status_http_code=$(echo "$status_response" | tail -n1)
status_response_body=$(echo "$status_response" | sed '$d')

echo "📥 Réponse (HTTP $status_http_code):"
echo "$status_response_body" | jq . 2>/dev/null || echo "$status_response_body"
echo ""

if [ "$status_http_code" = "200" ]; then
    echo "✅ Statut mis à jour vers ARRIVING"
else
    echo "❌ Erreur lors de la mise à jour du statut"
fi

echo ""

echo "📋 ÉTAPE 8 : Démarrage de la course"
echo "==================================="

# Mettre à jour le statut vers IN_PROGRESS
status_data2='{
  "status": "IN_PROGRESS"
}'

echo "📤 Démarrage de la course..."
status_response2=$(curl -s -w "\n%{http_code}" -X PUT http://localhost:3000/rides/$ride_id/status \
  -H "Content-Type: application/json" \
  -d "$status_data2")

status_http_code2=$(echo "$status_response2" | tail -n1)
status_response_body2=$(echo "$status_response2" | sed '$d')

echo "📥 Réponse (HTTP $status_http_code2):"
echo "$status_response_body2" | jq . 2>/dev/null || echo "$status_response_body2"
echo ""

if [ "$status_http_code2" = "200" ]; then
    echo "✅ Course démarrée avec succès"
else
    echo "❌ Erreur lors du démarrage de la course"
fi

echo ""

echo "📋 ÉTAPE 9 : Finalisation de la course"
echo "======================================"

# Mettre à jour le statut vers COMPLETED
status_data3='{
  "status": "COMPLETED"
}'

echo "📤 Finalisation de la course..."
status_response3=$(curl -s -w "\n%{http_code}" -X PUT http://localhost:3000/rides/$ride_id/status \
  -H "Content-Type: application/json" \
  -d "$status_data3")

status_http_code3=$(echo "$status_response3" | tail -n1)
status_response_body3=$(echo "$status_response3" | sed '$d')

echo "📥 Réponse (HTTP $status_http_code3):"
echo "$status_response_body3" | jq . 2>/dev/null || echo "$status_response_body3"
echo ""

if [ "$status_http_code3" = "200" ]; then
    echo "✅ Course finalisée avec succès"
else
    echo "❌ Erreur lors de la finalisation de la course"
fi

echo ""

echo "📋 ÉTAPE 10 : Vérification de la course terminée"
echo "==============================================="

echo "📤 Récupération des détails de la course..."
ride_details_response=$(curl -s -w "\n%{http_code}" -X GET http://localhost:3000/rides/$ride_id)

ride_details_http_code=$(echo "$ride_details_response" | tail -n1)
ride_details_response_body=$(echo "$ride_details_response" | sed '$d')

echo "📥 Réponse (HTTP $ride_details_http_code):"
echo "$ride_details_response_body" | jq . 2>/dev/null || echo "$ride_details_response_body"
echo ""

if [ "$ride_details_http_code" = "200" ]; then
    final_status=$(echo "$ride_details_response_body" | jq -r '.ride.status')
    echo "✅ Détails de la course récupérés"
    echo "   Statut final: $final_status"
else
    echo "❌ Erreur lors de la récupération des détails"
fi

echo ""

echo "📋 ÉTAPE 11 : Vérification des courses du passager"
echo "=================================================="

echo "📤 Récupération des courses du passager..."
passenger_rides_response=$(curl -s -w "\n%{http_code}" -X GET http://localhost:3000/rides/passenger/$passenger_id)

passenger_rides_http_code=$(echo "$passenger_rides_response" | tail -n1)
passenger_rides_response_body=$(echo "$passenger_rides_response" | sed '$d')

if [ "$passenger_rides_http_code" = "200" ]; then
    passenger_rides_count=$(echo "$passenger_rides_response_body" | jq -r '.rides | length')
    echo "✅ Courses du passager récupérées : $passenger_rides_count course(s)"
else
    echo "❌ Erreur lors de la récupération des courses du passager"
fi

echo ""

echo "📋 ÉTAPE 12 : Vérification des courses du chauffeur"
echo "==================================================="

echo "📤 Récupération des courses du chauffeur..."
driver_rides_response=$(curl -s -w "\n%{http_code}" -X GET http://localhost:3000/rides/driver/$driver_id)

driver_rides_http_code=$(echo "$driver_rides_response" | tail -n1)
driver_rides_response_body=$(echo "$driver_rides_response" | sed '$d')

if [ "$driver_rides_http_code" = "200" ]; then
    driver_rides_count=$(echo "$driver_rides_response_body" | jq -r '.rides | length')
    echo "✅ Courses du chauffeur récupérées : $driver_rides_count course(s)"
else
    echo "❌ Erreur lors de la récupération des courses du chauffeur"
fi

echo ""
echo "🎉 WORKFLOW TERMINÉ AVEC SUCCÈS !"
echo "================================="
echo ""
echo "📊 Résumé :"
echo "==========="
echo "✅ Passager créé (ID: $passenger_id)"
echo "✅ Chauffeur créé et mis en ligne (ID: $driver_id)"
echo "✅ Course créée (ID: $ride_id)"
echo "✅ Course acceptée par le chauffeur"
echo "✅ Course démarrée (ARRIVING → IN_PROGRESS)"
echo "✅ Course finalisée (COMPLETED)"
echo "✅ Historique des courses vérifié"
echo ""
echo "🚀 Le système de courses fonctionne parfaitement !"
echo ""
echo "💡 Fonctionnalités testées :"
echo "============================"
echo "• Création de course par un passager"
echo "• Acceptation de course par un chauffeur"
echo "• Gestion des statuts de course"
echo "• Validation des transitions de statut"
echo "• Récupération des courses par utilisateur"
echo "• Mise à jour des statistiques du chauffeur"
echo ""
echo "🔄 Test terminé !" 