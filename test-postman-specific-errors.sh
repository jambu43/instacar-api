#!/bin/bash

echo "🚨 Test des erreurs spécifiques Postman - InstaCar API"
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

echo "🔍 TEST 1 : JSON invalide"
echo "========================"

# Test avec JSON invalide
echo "📤 Test avec JSON invalide..."
invalid_json_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d '{"city": "Paris", "vehicleType": "PROPRIETAIRE", "brand": "Toyota", "model": "Corolla", "color": "Rouge", "year": 2021, "plateNumber": "TEST-INVALID-JSON",}')

invalid_json_http_code=$(echo "$invalid_json_response" | tail -n1)
invalid_json_response_body=$(echo "$invalid_json_response" | sed '$d')

echo "📥 Réponse (HTTP $invalid_json_http_code):"
echo "$invalid_json_response_body" | jq . 2>/dev/null || echo "$invalid_json_response_body"
echo ""

echo "🔍 TEST 2 : Content-Type manquant"
echo "================================="

# Test sans Content-Type
echo "📤 Test sans Content-Type..."
no_content_type_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle \
  -d '{"city": "Paris", "vehicleType": "PROPRIETAIRE", "brand": "Toyota", "model": "Corolla", "color": "Rouge", "year": 2021, "plateNumber": "TEST-NO-CONTENT-TYPE"}')

no_content_type_http_code=$(echo "$no_content_type_response" | tail -n1)
no_content_type_response_body=$(echo "$no_content_type_response" | sed '$d')

echo "📥 Réponse (HTTP $no_content_type_http_code):"
echo "$no_content_type_response_body" | jq . 2>/dev/null || echo "$no_content_type_response_body"
echo ""

echo "🔍 TEST 3 : Données manquantes"
echo "============================="

# Test avec données manquantes
echo "📤 Test avec données manquantes..."
missing_data_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d '{"city": "Paris", "vehicleType": "PROPRIETAIRE"}')

missing_data_http_code=$(echo "$missing_data_response" | tail -n1)
missing_data_response_body=$(echo "$missing_data_response" | sed '$d')

echo "📥 Réponse (HTTP $missing_data_http_code):"
echo "$missing_data_response_body" | jq . 2>/dev/null || echo "$missing_data_response_body"
echo ""

echo "🔍 TEST 4 : URL incorrecte"
echo "=========================="

# Test avec URL incorrecte
echo "📤 Test avec URL incorrecte..."
wrong_url_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle-wrong \
  -H "Content-Type: application/json" \
  -d '{"city": "Paris", "vehicleType": "PROPRIETAIRE", "brand": "Toyota", "model": "Corolla", "color": "Rouge", "year": 2021, "plateNumber": "TEST-WRONG-URL"}')

wrong_url_http_code=$(echo "$wrong_url_response" | tail -n1)
wrong_url_response_body=$(echo "$wrong_url_response" | sed '$d')

echo "📥 Réponse (HTTP $wrong_url_http_code):"
echo "$wrong_url_response_body" | jq . 2>/dev/null || echo "$wrong_url_response_body"
echo ""

echo "🔍 TEST 5 : Méthode incorrecte"
echo "=============================="

# Test avec méthode GET au lieu de POST
echo "📤 Test avec méthode GET..."
wrong_method_response=$(curl -s -w "\n%{http_code}" -X GET http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d '{"city": "Paris", "vehicleType": "PROPRIETAIRE", "brand": "Toyota", "model": "Corolla", "color": "Rouge", "year": 2021, "plateNumber": "TEST-WRONG-METHOD"}')

wrong_method_http_code=$(echo "$wrong_method_response" | tail -n1)
wrong_method_response_body=$(echo "$wrong_method_response" | sed '$d')

echo "📥 Réponse (HTTP $wrong_method_http_code):"
echo "$wrong_method_response_body" | jq . 2>/dev/null || echo "$wrong_method_response_body"
echo ""

echo "🔍 TEST 6 : Données dupliquées"
echo "=============================="

# Créer un véhicule pour tester les duplications
vehicle_data='{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Rouge",
  "year": 2021,
  "plateNumber": "TEST-DUPLICATE-001"
}'

echo "📤 Création du véhicule pour test de duplication..."
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

# Essayer de créer un autre véhicule avec la même plaque
echo "📤 Tentative de création d'un véhicule avec la même plaque..."
duplicate_plate_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d "$vehicle_data")

duplicate_plate_http_code=$(echo "$duplicate_plate_response" | tail -n1)
duplicate_plate_response_body=$(echo "$duplicate_plate_response" | sed '$d')

echo "📥 Réponse (HTTP $duplicate_plate_http_code):"
echo "$duplicate_plate_response_body" | jq . 2>/dev/null || echo "$duplicate_plate_response_body"
echo ""

echo "🔍 TEST 7 : Enregistrement chauffeur avec données dupliquées"
echo "============================================================"

# Enregistrer un chauffeur
driver_data='{
  "fullName": "Test Duplicate Driver",
  "phone": "+33123456794",
  "licenseNumber": "123456789012353",
  "identityDocument": "documents/test.pdf"
}'

echo "📤 Enregistrement du premier chauffeur..."
driver_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id \
  -H "Content-Type: application/json" \
  -d "$driver_data")

driver_http_code=$(echo "$driver_response" | tail -n1)
driver_response_body=$(echo "$driver_response" | sed '$d')

if [ "$driver_http_code" != "201" ]; then
    echo "❌ Erreur lors de l'enregistrement du chauffeur"
    exit 1
fi

echo "✅ Premier chauffeur enregistré"

# Essayer d'enregistrer un autre chauffeur avec le même téléphone
echo "📤 Tentative d'enregistrement avec téléphone dupliqué..."
duplicate_phone_data='{
  "fullName": "Test Duplicate Phone",
  "phone": "+33123456794",
  "licenseNumber": "123456789012354",
  "identityDocument": "documents/test.pdf"
}'

duplicate_phone_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id \
  -H "Content-Type: application/json" \
  -d "$duplicate_phone_data")

duplicate_phone_http_code=$(echo "$duplicate_phone_response" | tail -n1)
duplicate_phone_response_body=$(echo "$duplicate_phone_response" | sed '$d')

echo "📥 Réponse (HTTP $duplicate_phone_http_code):"
echo "$duplicate_phone_response_body" | jq . 2>/dev/null || echo "$duplicate_phone_response_body"
echo ""

echo "🔄 Résumé des tests :"
echo "===================="
echo "Test 1 (JSON invalide): $([ "$invalid_json_http_code" = "400" ] && echo "✅ PASS" || echo "❌ FAIL - HTTP $invalid_json_http_code")"
echo "Test 2 (Content-Type manquant): $([ "$no_content_type_http_code" = "400" ] && echo "✅ PASS" || echo "❌ FAIL - HTTP $no_content_type_http_code")"
echo "Test 3 (Données manquantes): $([ "$missing_data_http_code" = "400" ] && echo "✅ PASS" || echo "❌ FAIL - HTTP $missing_data_http_code")"
echo "Test 4 (URL incorrecte): $([ "$wrong_url_http_code" = "404" ] && echo "✅ PASS" || echo "❌ FAIL - HTTP $wrong_url_http_code")"
echo "Test 5 (Méthode incorrecte): $([ "$wrong_method_http_code" = "405" ] && echo "✅ PASS" || echo "❌ FAIL - HTTP $wrong_method_http_code")"
echo "Test 6 (Plaque dupliquée): $([ "$duplicate_plate_http_code" = "409" ] && echo "✅ PASS" || echo "❌ FAIL - HTTP $duplicate_plate_http_code")"
echo "Test 7 (Téléphone dupliqué): $([ "$duplicate_phone_http_code" = "409" ] && echo "✅ PASS" || echo "❌ FAIL - HTTP $duplicate_phone_http_code")"
echo ""

echo "💡 Solutions pour Postman :"
echo "=========================="
echo "1. Vérifiez que le JSON est valide (pas de virgule finale)"
echo "2. Assurez-vous que Content-Type est application/json"
echo "3. Vérifiez que toutes les données requises sont présentes"
echo "4. Vérifiez que l'URL est correcte"
echo "5. Utilisez la méthode POST"
echo "6. Utilisez des données uniques (téléphone, permis, plaque)"
echo "7. Vérifiez que le document d'identité existe"
echo ""

echo "🔄 Tests terminés !" 