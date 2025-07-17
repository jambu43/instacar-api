#!/bin/bash

echo "🚨 Reproduction de l'erreur 500 - InstaCar API"
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

echo "🔍 CAUSE 1 : Numéro de téléphone déjà utilisé"
echo "============================================="

# Créer un véhicule
vehicle_data='{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Rouge",
  "year": 2021,
  "plateNumber": "ERROR-PHONE-001"
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
  "fullName": "Test Error Phone",
  "phone": "+33123456787",
  "licenseNumber": "123456789012349",
  "identityDocument": "documents/test.pdf"
}'

echo "📤 Tentative d'enregistrement avec téléphone existant..."
echo "   Téléphone: +33123456787 (déjà utilisé)"
echo ""

driver_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id \
  -H "Content-Type: application/json" \
  -d "$driver_data")

driver_http_code=$(echo "$driver_response" | tail -n1)
driver_response_body=$(echo "$driver_response" | sed '$d')

echo "📥 Réponse (HTTP $driver_http_code):"
echo "$driver_response_body" | jq . 2>/dev/null || echo "$driver_response_body"
echo ""

if [ "$driver_http_code" = "409" ]; then
    echo "✅ Erreur 409 détectée (Conflict) - C'est normal !"
    echo "   Le numéro de téléphone +33123456787 est déjà utilisé"
else
    echo "❌ Attendu 409, reçu $driver_http_code"
fi

echo ""
echo "🔍 CAUSE 2 : Numéro de permis déjà utilisé"
echo "=========================================="

# Créer un autre véhicule
vehicle_data2='{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Bleu",
  "year": 2022,
  "plateNumber": "ERROR-LICENSE-001"
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
  "fullName": "Test Error License",
  "phone": "+33123456790",
  "licenseNumber": "123456789012346",
  "identityDocument": "documents/test.pdf"
}'

echo "📤 Tentative d'enregistrement avec permis existant..."
echo "   Permis: 123456789012346 (déjà utilisé)"
echo ""

driver_response2=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id2 \
  -H "Content-Type: application/json" \
  -d "$driver_data2")

driver_http_code2=$(echo "$driver_response2" | tail -n1)
driver_response_body2=$(echo "$driver_response2" | sed '$d')

echo "📥 Réponse (HTTP $driver_http_code2):"
echo "$driver_response_body2" | jq . 2>/dev/null || echo "$driver_response_body2"
echo ""

if [ "$driver_http_code2" = "409" ]; then
    echo "✅ Erreur 409 détectée (Conflict) - C'est normal !"
    echo "   Le numéro de permis 123456789012346 est déjà utilisé"
else
    echo "❌ Attendu 409, reçu $driver_http_code2"
fi

echo ""
echo "🔍 CAUSE 3 : Document d'identité manquant"
echo "========================================="

# Créer un troisième véhicule
vehicle_data3='{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Vert",
  "year": 2023,
  "plateNumber": "ERROR-DOC-001"
}'

echo "📤 Création du troisième véhicule..."
vehicle_response3=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d "$vehicle_data3")

vehicle_http_code3=$(echo "$vehicle_response3" | tail -n1)
vehicle_response_body3=$(echo "$vehicle_response3" | sed '$d')

if [ "$vehicle_http_code3" != "201" ]; then
    echo "❌ Erreur lors de la création du troisième véhicule"
    exit 1
fi

vehicle_id3=$(echo "$vehicle_response_body3" | jq -r '.vehicle.id')
echo "✅ Troisième véhicule créé avec ID: $vehicle_id3"

# Essayer d'enregistrer un chauffeur avec un document inexistant
driver_data3='{
  "fullName": "Test Error Document",
  "phone": "+33123456791",
  "licenseNumber": "123456789012350",
  "identityDocument": "documents/inexistant.pdf"
}'

echo "📤 Tentative d'enregistrement avec document inexistant..."
echo "   Document: documents/inexistant.pdf (n'existe pas)"
echo ""

driver_response3=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id3 \
  -H "Content-Type: application/json" \
  -d "$driver_data3")

driver_http_code3=$(echo "$driver_response3" | tail -n1)
driver_response_body3=$(echo "$driver_response3" | sed '$d')

echo "📥 Réponse (HTTP $driver_http_code3):"
echo "$driver_response_body3" | jq . 2>/dev/null || echo "$driver_response_body3"
echo ""

echo ""
echo "🔄 Résumé des erreurs reproduites :"
echo "=================================="
echo "1. Téléphone dupliqué (+33123456787) → HTTP 409 (Conflict)"
echo "2. Permis dupliqué (123456789012346) → HTTP 409 (Conflict)"
echo "3. Document inexistant → HTTP 500 (Internal Server Error)"
echo ""
echo "💡 Solutions :"
echo "============="
echo "• Utilisez des numéros de téléphone uniques"
echo "• Utilisez des numéros de permis uniques"
echo "• Assurez-vous que le document d'identité existe"
echo "• Vérifiez les logs de l'application pour plus de détails"
echo ""
echo "🔄 Script terminé !" 