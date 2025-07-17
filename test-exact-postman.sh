#!/bin/bash

echo "🔍 Test exact Postman - InstaCar API"
echo "===================================="
echo ""

# Vérifier si l'application est démarrée
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ L'application n'est pas démarrée"
    echo "   Démarrez-la avec: pnpm run start:dev"
    exit 1
fi

echo "✅ Application démarrée sur http://localhost:3000"
echo ""

echo "📋 Instructions pour reproduire EXACTEMENT votre requête Postman :"
echo "=================================================================="
echo ""
echo "1. Ouvrez Postman"
echo "2. Créez une nouvelle requête"
echo "3. Configurez EXACTEMENT comme suit :"
echo ""

echo "🔧 CONFIGURATION POSTMAN :"
echo "========================="
echo "Method: POST"
echo "URL: http://localhost:3000/drivers/register-vehicle"
echo ""
echo "Headers:"
echo "  Key: Content-Type"
echo "  Value: application/json"
echo ""
echo "Body:"
echo "  Type: raw"
echo "  Format: JSON"
echo "  Content:"
echo ""

cat << 'EOF'
{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Rouge",
  "year": 2021,
  "plateNumber": "POSTMAN-EXACT-001"
}
EOF

echo ""
echo "4. Envoyez la requête"
echo "5. Notez l'ID du véhicule dans la réponse"
echo "6. Créez une nouvelle requête"
echo "7. Configurez comme suit :"
echo ""

echo "🔧 CONFIGURATION POSTMAN - ÉTAPE 2 :"
echo "===================================="
echo "Method: POST"
echo "URL: http://localhost:3000/drivers/register-driver/{vehicleId}"
echo "  (Remplacez {vehicleId} par l'ID réel)"
echo ""
echo "Headers:"
echo "  Key: Content-Type"
echo "  Value: application/json"
echo ""
echo "Body:"
echo "  Type: raw"
echo "  Format: JSON"
echo "  Content:"
echo ""

cat << 'EOF'
{
  "fullName": "Test Postman Exact",
  "phone": "+33123456795",
  "licenseNumber": "123456789012355",
  "identityDocument": "documents/test.pdf"
}
EOF

echo ""
echo "🔍 Test automatique avec les mêmes données :"
echo "============================================"

# Test 1: Enregistrement du véhicule
echo "📤 Étape 1: Enregistrement du véhicule..."
vehicle_data='{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Rouge",
  "year": 2021,
  "plateNumber": "POSTMAN-EXACT-001"
}'

echo "📤 URL: POST http://localhost:3000/drivers/register-vehicle"
echo "📤 Headers: Content-Type: application/json"
echo "📤 Body: $vehicle_data"
echo ""

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
    echo "   Vérifiez votre configuration Postman"
    exit 1
fi

vehicle_id=$(echo "$vehicle_response_body" | jq -r '.vehicle.id')
echo "✅ Véhicule créé avec ID: $vehicle_id"
echo ""

# Test 2: Enregistrement du chauffeur
echo "📤 Étape 2: Enregistrement du chauffeur..."
driver_data='{
  "fullName": "Test Postman Exact",
  "phone": "+33123456795",
  "licenseNumber": "123456789012355",
  "identityDocument": "documents/test.pdf"
}'

echo "📤 URL: POST http://localhost:3000/drivers/register-driver/$vehicle_id"
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
    echo "🔍 Si vous obtenez encore une erreur 500 dans Postman :"
    echo "======================================================"
    echo "1. Vérifiez que vous utilisez EXACTEMENT la même configuration"
    echo "2. Assurez-vous qu'il n'y a pas de virgule finale dans le JSON"
    echo "3. Vérifiez que le Content-Type est application/json"
    echo "4. Vérifiez que l'URL est exacte"
    echo "5. Vérifiez que vous remplacez {vehicleId} par l'ID réel"
    echo ""
    echo "📋 Checklist finale :"
    echo "===================="
    echo "□ Method: POST"
    echo "□ URL exacte avec l'ID du véhicule"
    echo "□ Header Content-Type: application/json"
    echo "□ Body en raw JSON"
    echo "□ JSON valide (pas de virgule finale)"
    echo "□ Données uniques"
    echo ""
    echo "💡 Si le problème persiste :"
    echo "==========================="
    echo "1. Copiez-collez la requête exacte de Postman"
    echo "2. Comparez avec les exemples ci-dessus"
    echo "3. Utilisez les scripts de diagnostic"
    echo "4. Vérifiez les logs de l'application"
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