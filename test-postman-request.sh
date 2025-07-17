#!/bin/bash

echo "🔍 Test de requête Postman - InstaCar API"
echo "========================================="
echo ""

# Vérifier si l'application est démarrée
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ L'application n'est pas démarrée"
    echo "   Démarrez-la avec: pnpm run start:dev"
    exit 1
fi

echo "✅ Application démarrée sur http://localhost:3000"
echo ""

echo "📋 Instructions pour reproduire l'erreur dans Postman :"
echo "======================================================"
echo ""
echo "1. Créez une nouvelle requête POST"
echo "2. URL: http://localhost:3000/drivers/register-vehicle"
echo "3. Headers: Content-Type: application/json"
echo "4. Body (raw JSON):"
echo ""

cat << 'EOF'
{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Rouge",
  "year": 2021,
  "plateNumber": "POSTMAN-ERROR-001"
}
EOF

echo ""
echo "5. Envoyez la requête et notez l'ID du véhicule"
echo "6. Créez une nouvelle requête POST"
echo "7. URL: http://localhost:3000/drivers/register-driver/{vehicleId}"
echo "8. Headers: Content-Type: application/json"
echo "9. Body (raw JSON):"
echo ""

cat << 'EOF'
{
  "fullName": "Test Postman Error",
  "phone": "+33123456793",
  "licenseNumber": "123456789012352",
  "identityDocument": "documents/test.pdf"
}
EOF

echo ""
echo "🔍 Test automatique avec curl :"
echo "=============================="

# Test 1: Enregistrement du véhicule
echo "📤 Étape 1: Enregistrement du véhicule..."
vehicle_data='{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Rouge",
  "year": 2021,
  "plateNumber": "POSTMAN-ERROR-001"
}'

vehicle_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d "$vehicle_data")

vehicle_http_code=$(echo "$vehicle_response" | tail -n1)
vehicle_response_body=$(echo "$vehicle_response" | sed '$d')

echo "📥 Réponse véhicule (HTTP $vehicle_http_code):"
echo "$vehicle_response_body" | jq . 2>/dev/null || echo "$vehicle_response_body"
echo ""

if [ "$vehicle_http_code" != "201" ]; then
    echo "❌ Erreur lors de l'enregistrement du véhicule"
    exit 1
fi

vehicle_id=$(echo "$vehicle_response_body" | jq -r '.vehicle.id')
echo "✅ Véhicule créé avec ID: $vehicle_id"
echo ""

# Test 2: Enregistrement du chauffeur
echo "📤 Étape 2: Enregistrement du chauffeur..."
driver_data='{
  "fullName": "Test Postman Error",
  "phone": "+33123456793",
  "licenseNumber": "123456789012352",
  "identityDocument": "documents/test.pdf"
}'

echo "📤 Envoi de la requête POST à http://localhost:3000/drivers/register-driver/$vehicle_id"
echo "📤 Headers: Content-Type: application/json"
echo "📤 Body: $driver_data"
echo ""

driver_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id \
  -H "Content-Type: application/json" \
  -d "$driver_data")

driver_http_code=$(echo "$driver_response" | tail -n1)
driver_response_body=$(echo "$driver_response" | sed '$d')

echo "📥 Réponse chauffeur (HTTP $driver_http_code):"
echo "$driver_response_body" | jq . 2>/dev/null || echo "$driver_response_body"
echo ""

if [ "$driver_http_code" = "201" ]; then
    echo "✅ Test réussi ! L'API fonctionne correctement"
    echo ""
    echo "🔍 Problèmes possibles avec Postman :"
    echo "===================================="
    echo "1. Vérifiez que l'URL est exacte : http://localhost:3000/drivers/register-driver/{vehicleId}"
    echo "2. Remplacez {vehicleId} par l'ID réel du véhicule"
    echo "3. Vérifiez que le Content-Type est application/json"
    echo "4. Vérifiez que le body est en format JSON valide"
    echo "5. Vérifiez que les données sont uniques (téléphone, permis)"
    echo ""
    echo "📋 Checklist Postman :"
    echo "====================="
    echo "□ URL correcte avec l'ID du véhicule"
    echo "□ Method: POST"
    echo "□ Headers: Content-Type: application/json"
    echo "□ Body: raw JSON"
    echo "□ JSON valide (pas d'erreurs de syntaxe)"
    echo "□ Données uniques (téléphone, permis)"
    echo "□ Document d'identité existe"
else
    echo "❌ Erreur détectée !"
    echo ""
    echo "🔍 Diagnostic :"
    echo "=============="
    echo "Code HTTP: $driver_http_code"
    echo "Réponse: $driver_response_body"
    echo ""
    echo "💡 Solutions :"
    echo "============="
    echo "1. Vérifiez les logs de l'application"
    echo "2. Utilisez des données uniques"
    echo "3. Vérifiez que le document existe"
    echo "4. Exécutez: ./debug-driver-registration.sh"
fi

echo ""
echo "🔄 Test terminé !" 