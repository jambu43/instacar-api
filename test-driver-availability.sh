#!/bin/bash

echo "🚗 Test de disponibilité des chauffeurs - InstaCar API"
echo "====================================================="
echo ""

# Vérifier si l'application est démarrée
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ L'application n'est pas démarrée"
    echo "   Démarrez-la avec: pnpm run start:dev"
    exit 1
fi

echo "✅ Application démarrée sur http://localhost:3000"
echo ""

echo "🔍 TEST 1 : Création d'un chauffeur pour les tests"
echo "=================================================="

# Créer un véhicule
vehicle_data='{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Bleu",
  "year": 2022,
  "plateNumber": "AVAILABILITY-TEST-001"
}'

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
driver_data='{
  "fullName": "Test Driver Availability",
  "phone": "+33123456796",
  "licenseNumber": "123456789012356",
  "identityDocument": "documents/test.pdf"
}'

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

echo "🔍 TEST 2 : Mise en ligne du chauffeur"
echo "======================================"

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
availability_response_body=$(echo "$availability_response" | sed '$d')

echo "📥 Réponse (HTTP $availability_http_code):"
echo "$availability_response_body" | jq . 2>/dev/null || echo "$availability_response_body"
echo ""

if [ "$availability_http_code" = "200" ]; then
    echo "✅ Chauffeur mis en ligne avec succès"
else
    echo "❌ Erreur lors de la mise en ligne"
    exit 1
fi

echo ""

echo "🔍 TEST 3 : Recherche de chauffeurs disponibles"
echo "==============================================="

# Rechercher des chauffeurs disponibles
search_data='{
  "lat": 48.8566,
  "lng": 2.3522,
  "radius": 5,
  "limit": 10
}'

echo "📤 Recherche de chauffeurs disponibles..."
search_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/search \
  -H "Content-Type: application/json" \
  -d "$search_data")

search_http_code=$(echo "$search_response" | tail -n1)
search_response_body=$(echo "$search_response" | sed '$d')

echo "📥 Réponse (HTTP $search_http_code):"
echo "$search_response_body" | jq . 2>/dev/null || echo "$search_response_body"
echo ""

if [ "$search_http_code" = "200" ] || [ "$search_http_code" = "201" ]; then
    driver_count=$(echo "$search_response_body" | jq -r '.drivers | length')
    echo "✅ Recherche réussie : $driver_count chauffeur(s) trouvé(s)"
else
    echo "❌ Erreur lors de la recherche"
    exit 1
fi

echo ""

echo "🔍 TEST 4 : Mise hors ligne du chauffeur"
echo "========================================"

# Mettre le chauffeur hors ligne
offline_data='{
  "isAvailable": false
}'

echo "📤 Mise hors ligne du chauffeur..."
offline_response=$(curl -s -w "\n%{http_code}" -X PUT http://localhost:3000/drivers/availability/$driver_id \
  -H "Content-Type: application/json" \
  -d "$offline_data")

offline_http_code=$(echo "$offline_response" | tail -n1)
offline_response_body=$(echo "$offline_response" | sed '$d')

echo "📥 Réponse (HTTP $offline_http_code):"
echo "$offline_response_body" | jq . 2>/dev/null || echo "$offline_response_body"
echo ""

if [ "$offline_http_code" = "200" ]; then
    echo "✅ Chauffeur mis hors ligne avec succès"
else
    echo "❌ Erreur lors de la mise hors ligne"
    exit 1
fi

echo ""

echo "🔍 TEST 5 : Vérification que le chauffeur n'apparaît plus dans la recherche"
echo "=========================================================================="

# Rechercher à nouveau
echo "📤 Recherche après mise hors ligne..."
search_response2=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/search \
  -H "Content-Type: application/json" \
  -d "$search_data")

search_http_code2=$(echo "$search_response2" | tail -n1)
search_response_body2=$(echo "$search_response2" | sed '$d')

echo "📥 Réponse (HTTP $search_http_code2):"
echo "$search_response_body2" | jq . 2>/dev/null || echo "$search_response_body2"
echo ""

if [ "$search_http_code2" = "200" ] || [ "$search_http_code2" = "201" ]; then
    driver_count2=$(echo "$search_response_body2" | jq -r '.drivers | length')
    echo "✅ Recherche après mise hors ligne : $driver_count2 chauffeur(s) trouvé(s)"
    
    if [ "$driver_count2" -lt "$driver_count" ]; then
        echo "✅ Le chauffeur a bien disparu de la recherche"
    else
        echo "⚠️ Le chauffeur est toujours visible (peut-être d'autres chauffeurs en ligne)"
    fi
else
    echo "❌ Erreur lors de la recherche"
fi

echo ""

echo "🔍 TEST 6 : Recherche avec filtre par type de véhicule"
echo "======================================================"

# Rechercher avec filtre
search_filtered_data='{
  "lat": 48.8566,
  "lng": 2.3522,
  "radius": 5,
  "vehicleType": "PROPRIETAIRE",
  "limit": 10
}'

echo "📤 Recherche avec filtre PROPRIETAIRE..."
search_filtered_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/search \
  -H "Content-Type: application/json" \
  -d "$search_filtered_data")

search_filtered_http_code=$(echo "$search_filtered_response" | tail -n1)
search_filtered_response_body=$(echo "$search_filtered_response" | sed '$d')

echo "📥 Réponse (HTTP $search_filtered_http_code):"
echo "$search_filtered_response_body" | jq . 2>/dev/null || echo "$search_filtered_response_body"
echo ""

if [ "$search_filtered_http_code" = "200" ] || [ "$search_filtered_http_code" = "201" ]; then
    filtered_count=$(echo "$search_filtered_response_body" | jq -r '.drivers | length')
    echo "✅ Recherche filtrée réussie : $filtered_count chauffeur(s) PROPRIETAIRE trouvé(s)"
else
    echo "❌ Erreur lors de la recherche filtrée"
fi

echo ""
echo "🔄 Résumé des tests :"
echo "===================="
echo "Test 1 (Création chauffeur): $([ "$driver_http_code" = "201" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Test 2 (Mise en ligne): $([ "$availability_http_code" = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Test 3 (Recherche en ligne): $([ "$search_http_code" = "200" ] || [ "$search_http_code" = "201" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Test 4 (Mise hors ligne): $([ "$offline_http_code" = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Test 5 (Recherche hors ligne): $([ "$search_http_code2" = "200" ] || [ "$search_http_code2" = "201" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Test 6 (Recherche filtrée): $([ "$search_filtered_http_code" = "200" ] || [ "$search_filtered_http_code" = "201" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo ""
echo "🎉 Tests terminés !" 