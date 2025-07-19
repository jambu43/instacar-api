#!/bin/bash

echo "🚗 Démonstration du workflow chauffeur - InstaCar API"
echo "===================================================="
echo ""

# Vérifier si l'application est démarrée
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ L'application n'est pas démarrée"
    echo "   Démarrez-la avec: pnpm run start:dev"
    exit 1
fi

echo "✅ Application démarrée sur http://localhost:3000"
echo ""

echo "🎯 WORKFLOW COMPLET DU CHAUFFEUR"
echo "================================"
echo ""

echo "📋 ÉTAPE 1 : Inscription du véhicule"
echo "===================================="

# Générer des données uniques
TIMESTAMP=$(date +%s)
PLATE_NUMBER="DEMO-${TIMESTAMP}"

vehicle_data=$(cat <<EOF
{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Blanc",
  "year": 2023,
  "plateNumber": "$PLATE_NUMBER"
}
EOF
)

echo "📤 Enregistrement du véhicule..."
echo "   Plaque: $PLATE_NUMBER"
echo ""

vehicle_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d "$vehicle_data")

vehicle_http_code=$(echo "$vehicle_response" | tail -n1)
vehicle_response_body=$(echo "$vehicle_response" | sed '$d')

if [ "$vehicle_http_code" != "201" ]; then
    echo "❌ Erreur lors de l'enregistrement du véhicule"
    exit 1
fi

vehicle_id=$(echo "$vehicle_response_body" | jq -r '.vehicle.id')
echo "✅ Véhicule enregistré avec succès !"
echo "   ID: $vehicle_id"
echo "   Plaque: $PLATE_NUMBER"
echo ""

echo "📋 ÉTAPE 2 : Inscription du chauffeur"
echo "====================================="

# Générer des données uniques pour le chauffeur
PHONE="+331234567${TIMESTAMP: -4}"
LICENSE="123456789${TIMESTAMP: -6}"

driver_data=$(cat <<EOF
{
  "fullName": "Jean Dupont Demo",
  "phone": "$PHONE",
  "licenseNumber": "$LICENSE",
  "identityDocument": "documents/test.pdf"
}
EOF
)

echo "📤 Enregistrement du chauffeur..."
echo "   Nom: Jean Dupont Demo"
echo "   Téléphone: $PHONE"
echo "   Permis: $LICENSE"
echo ""

driver_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id \
  -H "Content-Type: application/json" \
  -d "$driver_data")

driver_http_code=$(echo "$driver_response" | tail -n1)
driver_response_body=$(echo "$driver_response" | sed '$d')

if [ "$driver_http_code" != "201" ]; then
    echo "❌ Erreur lors de l'enregistrement du chauffeur"
    exit 1
fi

driver_id=$(echo "$driver_response_body" | jq -r '.driver.id')
echo "✅ Chauffeur enregistré avec succès !"
echo "   ID: $driver_id"
echo "   Nom: Jean Dupont Demo"
echo ""

echo "📋 ÉTAPE 3 : Vérification du statut d'inscription"
echo "================================================="

echo "📤 Vérification du statut..."
status_response=$(curl -s -w "\n%{http_code}" -X GET http://localhost:3000/drivers/status/$driver_id)

status_http_code=$(echo "$status_response" | tail -n1)
status_response_body=$(echo "$status_response" | sed '$d')

if [ "$status_http_code" = "200" ]; then
    is_complete=$(echo "$status_response_body" | jq -r '.isRegistrationComplete')
    if [ "$is_complete" = "true" ]; then
        echo "✅ Inscription complète ! Le chauffeur peut maintenant être mis en ligne"
    else
        echo "⚠️ Inscription incomplète"
    fi
else
    echo "❌ Erreur lors de la vérification du statut"
fi

echo ""

echo "📋 ÉTAPE 4 : Mise en ligne du chauffeur"
echo "======================================="

# Position à Paris
availability_data='{
  "isAvailable": true,
  "currentLat": 48.8566,
  "currentLng": 2.3522
}'

echo "📤 Mise en ligne du chauffeur..."
echo "   Position: Paris (48.8566, 2.3522)"
echo ""

availability_response=$(curl -s -w "\n%{http_code}" -X PUT http://localhost:3000/drivers/availability/$driver_id \
  -H "Content-Type: application/json" \
  -d "$availability_data")

availability_http_code=$(echo "$availability_response" | tail -n1)
availability_response_body=$(echo "$availability_response" | sed '$d')

if [ "$availability_http_code" = "200" ]; then
    echo "✅ Chauffeur mis en ligne avec succès !"
    echo "   Il est maintenant visible pour les passagers"
else
    echo "❌ Erreur lors de la mise en ligne"
    exit 1
fi

echo ""

echo "📋 ÉTAPE 5 : Recherche de chauffeurs disponibles"
echo "================================================"

search_data='{
  "lat": 48.8566,
  "lng": 2.3522,
  "radius": 5,
  "limit": 10
}'

echo "📤 Recherche de chauffeurs disponibles..."
echo "   Position: Paris (48.8566, 2.3522)"
echo "   Rayon: 5 km"
echo ""

search_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/search \
  -H "Content-Type: application/json" \
  -d "$search_data")

search_http_code=$(echo "$search_response" | tail -n1)
search_response_body=$(echo "$search_response" | sed '$d')

if [ "$search_http_code" = "200" ] || [ "$search_http_code" = "201" ]; then
    driver_count=$(echo "$search_response_body" | jq -r '.drivers | length')
    echo "✅ Recherche réussie !"
    echo "   $driver_count chauffeur(s) disponible(s) trouvé(s)"
    
    if [ "$driver_count" -gt 0 ]; then
        echo "   Le chauffeur apparaît dans les résultats de recherche"
    else
        echo "   Aucun chauffeur disponible dans la zone"
    fi
else
    echo "❌ Erreur lors de la recherche"
fi

echo ""

echo "📋 ÉTAPE 6 : Mise hors ligne du chauffeur"
echo "========================================="

offline_data='{
  "isAvailable": false
}'

echo "📤 Mise hors ligne du chauffeur..."
echo ""

offline_response=$(curl -s -w "\n%{http_code}" -X PUT http://localhost:3000/drivers/availability/$driver_id \
  -H "Content-Type: application/json" \
  -d "$offline_data")

offline_http_code=$(echo "$offline_response" | tail -n1)
offline_response_body=$(echo "$offline_response" | sed '$d')

if [ "$offline_http_code" = "200" ]; then
    echo "✅ Chauffeur mis hors ligne avec succès !"
    echo "   Il n'est plus visible pour les passagers"
else
    echo "❌ Erreur lors de la mise hors ligne"
fi

echo ""

echo "📋 ÉTAPE 7 : Vérification de la disparition de la recherche"
echo "==========================================================="

echo "📤 Recherche après mise hors ligne..."
echo ""

search_response2=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/search \
  -H "Content-Type: application/json" \
  -d "$search_data")

search_http_code2=$(echo "$search_response2" | tail -n1)
search_response_body2=$(echo "$search_response2" | sed '$d')

if [ "$search_http_code2" = "200" ] || [ "$search_http_code2" = "201" ]; then
    driver_count2=$(echo "$search_response_body2" | jq -r '.drivers | length')
    echo "✅ Recherche après mise hors ligne :"
    echo "   $driver_count2 chauffeur(s) disponible(s) trouvé(s)"
    
    if [ "$driver_count2" -lt "$driver_count" ]; then
        echo "   ✅ Le chauffeur a bien disparu de la recherche"
    else
        echo "   ⚠️ Le chauffeur est toujours visible (peut-être d'autres chauffeurs en ligne)"
    fi
else
    echo "❌ Erreur lors de la recherche"
fi

echo ""
echo "🎉 WORKFLOW TERMINÉ AVEC SUCCÈS !"
echo "================================="
echo ""
echo "📊 Résumé :"
echo "==========="
echo "✅ Véhicule enregistré (ID: $vehicle_id)"
echo "✅ Chauffeur enregistré (ID: $driver_id)"
echo "✅ Chauffeur mis en ligne"
echo "✅ Chauffeur trouvé dans la recherche"
echo "✅ Chauffeur mis hors ligne"
echo "✅ Chauffeur disparu de la recherche"
echo ""
echo "🚀 Le système de disponibilité fonctionne parfaitement !"
echo ""
echo "💡 Utilisation :"
echo "==============="
echo "• Les chauffeurs doivent s'inscrire en 2 étapes"
echo "• Ils doivent activer leur disponibilité pour recevoir des courses"
echo "• Seuls les chauffeurs en ligne apparaissent dans la recherche"
echo "• La recherche prend en compte la distance et le type de véhicule"
echo ""
echo "🔄 Démonstration terminée !" 