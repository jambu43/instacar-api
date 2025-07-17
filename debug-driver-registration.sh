#!/bin/bash

echo "🔍 Diagnostic d'enregistrement de chauffeur - InstaCar API"
echo "========================================================="
echo ""

# Vérifier si l'application est démarrée
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ L'application n'est pas démarrée"
    echo "   Démarrez-la avec: pnpm run start:dev"
    exit 1
fi

echo "✅ Application démarrée sur http://localhost:3000"
echo ""

# Test 1: Vérifier les contraintes uniques
echo "🔍 TEST 1 : Vérification des contraintes uniques"
echo "================================================"

# Vérifier les numéros de téléphone existants
echo "📱 Numéros de téléphone existants :"
psql postgresql://root:root@localhost:5432/instacar -c "SELECT phone, fullName FROM \"Driver\" ORDER BY id;" 2>/dev/null || echo "Aucun chauffeur trouvé"

echo ""

# Vérifier les numéros de permis existants
echo "🚗 Numéros de permis existants :"
psql postgresql://root:root@localhost:5432/instacar -c "SELECT \"licenseNumber\", fullName FROM \"Driver\" ORDER BY id;" 2>/dev/null || echo "Aucun chauffeur trouvé"

echo ""

# Vérifier les plaques d'immatriculation existantes
echo "🚙 Plaques d'immatriculation existantes :"
psql postgresql://root:root@localhost:5432/instacar -c "SELECT \"plateNumber\", brand, model FROM \"Vehicle\" ORDER BY id;" 2>/dev/null || echo "Aucun véhicule trouvé"

echo ""

# Test 2: Test d'enregistrement avec données uniques
echo "🧪 TEST 2 : Test d'enregistrement avec données uniques"
echo "====================================================="

# Générer des données uniques
TIMESTAMP=$(date +%s)
CITY="Paris"
VEHICLE_TYPE="PROPRIETAIRE"
BRAND="Toyota"
MODEL="Corolla"
COLOR="Blanc"
YEAR=2020
PLATE_NUMBER="TEST-${TIMESTAMP}"
FULL_NAME="Test Driver ${TIMESTAMP}"
PHONE="+331234567${TIMESTAMP: -4}"
LICENSE_NUMBER="123456789${TIMESTAMP: -6}"

echo "   Ville: $CITY"
echo "   Type: $VEHICLE_TYPE"
echo "   Marque: $BRAND"
echo "   Modèle: $MODEL"
echo "   Couleur: $COLOR"
echo "   Année: $YEAR"
echo "   Plaque: $PLATE_NUMBER"
echo "   Nom: $FULL_NAME"
echo "   Téléphone: $PHONE"
echo "   Permis: $LICENSE_NUMBER"
echo ""

# Étape 1: Enregistrer le véhicule
echo "📤 Étape 1: Enregistrement du véhicule..."
vehicle_data=$(cat <<EOF
{
  "city": "$CITY",
  "vehicleType": "$VEHICLE_TYPE",
  "brand": "$BRAND",
  "model": "$MODEL",
  "color": "$COLOR",
  "year": $YEAR,
  "plateNumber": "$PLATE_NUMBER"
}
EOF
)

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

# Extraire l'ID du véhicule
vehicle_id=$(echo "$vehicle_response_body" | jq -r '.vehicle.id' 2>/dev/null)
if [ "$vehicle_id" = "null" ] || [ -z "$vehicle_id" ]; then
    echo "❌ Impossible de récupérer l'ID du véhicule"
    exit 1
fi

echo "✅ Véhicule enregistré avec succès ! ID: $vehicle_id"
echo ""

# Étape 2: Enregistrer le chauffeur
echo "📤 Étape 2: Enregistrement du chauffeur..."
driver_data=$(cat <<EOF
{
  "fullName": "$FULL_NAME",
  "phone": "$PHONE",
  "licenseNumber": "$LICENSE_NUMBER",
  "identityDocument": "documents/test.pdf"
}
EOF
)

driver_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id \
  -H "Content-Type: application/json" \
  -d "$driver_data")

driver_http_code=$(echo "$driver_response" | tail -n1)
driver_response_body=$(echo "$driver_response" | sed '$d')

echo "📥 Réponse chauffeur (HTTP $driver_http_code):"
echo "$driver_response_body" | jq . 2>/dev/null || echo "$driver_response_body"
echo ""

if [ "$driver_http_code" = "201" ]; then
    driver_id=$(echo "$driver_response_body" | jq -r '.driver.id' 2>/dev/null)
    echo "🎉 Inscription du chauffeur réussie !"
    echo "   ID Chauffeur: $driver_id"
    echo "   ID Véhicule: $vehicle_id"
    echo ""
    echo "✅ Le système fonctionne correctement !"
else
    echo "❌ Erreur lors de l'enregistrement du chauffeur"
    echo ""
    echo "🔍 Causes possibles :"
    echo "   1. Numéro de téléphone déjà utilisé"
    echo "   2. Numéro de permis déjà utilisé"
    echo "   3. Problème de base de données"
    echo "   4. Erreur dans le code"
    echo ""
    echo "📋 Pour diagnostiquer :"
    echo "   - Vérifiez les logs de l'application"
    echo "   - Vérifiez les contraintes uniques ci-dessus"
    echo "   - Utilisez des données uniques"
fi

echo ""
echo "🔄 Diagnostic terminé !" 