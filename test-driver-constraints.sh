#!/bin/bash

echo "🧪 Test des contraintes uniques - Inscription chauffeur"
echo "======================================================"
echo ""

# Vérifier si l'application est démarrée
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ L'application n'est pas démarrée"
    echo "   Démarrez-la avec: pnpm run start:dev"
    exit 1
fi

echo "✅ Application démarrée sur http://localhost:3000"
echo ""

# Test 1: Téléphone déjà utilisé
echo "🔍 TEST 1 : Numéro de téléphone déjà utilisé"
echo "============================================"

# Créer un véhicule pour le test
vehicle_data='{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Test",
  "model": "Test",
  "color": "Rouge",
  "year": 2021,
  "plateNumber": "TEST-PHONE-001"
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

# Essayer d'enregistrer un chauffeur avec un téléphone qui existe déjà
driver_data='{
  "fullName": "Test Driver Phone",
  "phone": "+33123456787",
  "licenseNumber": "123456789012347",
  "identityDocument": "documents/test.pdf"
}'

echo "📤 Tentative d'enregistrement avec téléphone existant..."
driver_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id \
  -H "Content-Type: application/json" \
  -d "$driver_data")

driver_http_code=$(echo "$driver_response" | tail -n1)
driver_response_body=$(echo "$driver_response" | sed '$d')

echo "📥 Réponse (HTTP $driver_http_code):"
echo "$driver_response_body" | jq . 2>/dev/null || echo "$driver_response_body"
echo ""

if [ "$driver_http_code" = "409" ]; then
    echo "✅ Test réussi : Erreur 409 détectée pour téléphone dupliqué"
else
    echo "❌ Test échoué : Attendu 409, reçu $driver_http_code"
fi

echo ""

# Test 2: Permis déjà utilisé
echo "🔍 TEST 2 : Numéro de permis déjà utilisé"
echo "========================================="

# Créer un autre véhicule
vehicle_data2='{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Test2",
  "model": "Test2",
  "color": "Bleu",
  "year": 2022,
  "plateNumber": "TEST-LICENSE-001"
}'

echo "📤 Création du deuxième véhicule..."
vehicle_response2=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d "$vehicle_data2")

vehicle_http_code2=$(echo "$vehicle_response2" | tail -n1)
vehicle_response_body2=$(echo "$vehicle_response2" | sed '$d')

if [ "$vehicle_http_code2" != "201" ]; then
    echo "❌ Erreur lors de la création du deuxième véhicule"
    exit 1
fi

vehicle_id2=$(echo "$vehicle_response_body2" | jq -r '.vehicle.id')
echo "✅ Deuxième véhicule créé avec ID: $vehicle_id2"

# Essayer d'enregistrer un chauffeur avec un permis qui existe déjà
driver_data2='{
  "fullName": "Test Driver License",
  "phone": "+33123456788",
  "licenseNumber": "123456789012346",
  "identityDocument": "documents/test.pdf"
}'

echo "📤 Tentative d'enregistrement avec permis existant..."
driver_response2=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id2 \
  -H "Content-Type: application/json" \
  -d "$driver_data2")

driver_http_code2=$(echo "$driver_response2" | tail -n1)
driver_response_body2=$(echo "$driver_response2" | sed '$d')

echo "📥 Réponse (HTTP $driver_http_code2):"
echo "$driver_response_body2" | jq . 2>/dev/null || echo "$driver_response_body2"
echo ""

if [ "$driver_http_code2" = "409" ]; then
    echo "✅ Test réussi : Erreur 409 détectée pour permis dupliqué"
else
    echo "❌ Test échoué : Attendu 409, reçu $driver_http_code2"
fi

echo ""

# Test 3: Véhicule inexistant
echo "🔍 TEST 3 : Véhicule inexistant"
echo "==============================="

driver_data3='{
  "fullName": "Test Driver Invalid",
  "phone": "+33123456789",
  "licenseNumber": "123456789012348",
  "identityDocument": "documents/test.pdf"
}'

echo "📤 Tentative d'enregistrement avec véhicule inexistant (ID: 99999)..."
driver_response3=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/99999 \
  -H "Content-Type: application/json" \
  -d "$driver_data3")

driver_http_code3=$(echo "$driver_response3" | tail -n1)
driver_response_body3=$(echo "$driver_response3" | sed '$d')

echo "📥 Réponse (HTTP $driver_http_code3):"
echo "$driver_response_body3" | jq . 2>/dev/null || echo "$driver_response_body3"
echo ""

if [ "$driver_http_code3" = "404" ]; then
    echo "✅ Test réussi : Erreur 404 détectée pour véhicule inexistant"
else
    echo "❌ Test échoué : Attendu 404, reçu $driver_http_code3"
fi

echo ""

# Test 4: Succès avec données uniques
echo "🔍 TEST 4 : Succès avec données uniques"
echo "======================================"

TIMESTAMP=$(date +%s)
vehicle_data4=$(cat <<EOF
{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Test4",
  "model": "Test4",
  "color": "Vert",
  "year": 2023,
  "plateNumber": "TEST-SUCCESS-${TIMESTAMP}"
}
EOF
)

echo "📤 Création du véhicule pour test de succès..."
vehicle_response4=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d "$vehicle_data4")

vehicle_http_code4=$(echo "$vehicle_response4" | tail -n1)
vehicle_response_body4=$(echo "$vehicle_response4" | sed '$d')

if [ "$vehicle_http_code4" != "201" ]; then
    echo "❌ Erreur lors de la création du véhicule pour test de succès"
    exit 1
fi

vehicle_id4=$(echo "$vehicle_response_body4" | jq -r '.vehicle.id')
echo "✅ Véhicule créé avec ID: $vehicle_id4"

driver_data4=$(cat <<EOF
{
  "fullName": "Test Driver Success ${TIMESTAMP}",
  "phone": "+331234567${TIMESTAMP: -4}",
  "licenseNumber": "123456789${TIMESTAMP: -6}",
  "identityDocument": "documents/test.pdf"
}
EOF
)

echo "📤 Tentative d'enregistrement avec données uniques..."
driver_response4=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id4 \
  -H "Content-Type: application/json" \
  -d "$driver_data4")

driver_http_code4=$(echo "$driver_response4" | tail -n1)
driver_response_body4=$(echo "$driver_response4" | sed '$d')

echo "📥 Réponse (HTTP $driver_http_code4):"
echo "$driver_response_body4" | jq . 2>/dev/null || echo "$driver_response_body4"
echo ""

if [ "$driver_http_code4" = "201" ]; then
    echo "✅ Test réussi : Inscription réussie avec données uniques"
else
    echo "❌ Test échoué : Attendu 201, reçu $driver_http_code4"
fi

echo ""
echo "🔄 Résumé des tests :"
echo "===================="
echo "Test 1 (Téléphone dupliqué): $([ "$driver_http_code" = "409" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Test 2 (Permis dupliqué): $([ "$driver_http_code2" = "409" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Test 3 (Véhicule inexistant): $([ "$driver_http_code3" = "404" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Test 4 (Succès): $([ "$driver_http_code4" = "201" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo ""
echo "🔄 Tests terminés !" 