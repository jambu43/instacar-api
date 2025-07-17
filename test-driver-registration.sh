#!/bin/bash

echo "🚗 Test d'inscription de chauffeur - InstaCar API"
echo "================================================"
echo ""

# Vérifier si l'application est démarrée
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ L'application n'est pas démarrée"
    echo "   Démarrez-la avec: pnpm run start:dev"
    exit 1
fi

echo "✅ Application démarrée sur http://localhost:3000"
echo ""

# Étape 1: Enregistrement du véhicule
echo "🚙 ÉTAPE 1 : Enregistrement du véhicule"
echo "======================================"

# Données du véhicule
CITY="Paris"
VEHICLE_TYPE="PROPRIETAIRE"
BRAND="Toyota"
MODEL="Corolla"
COLOR="Blanc"
YEAR=2020
PLATE_NUMBER="AB-123-CD-$(date +%s)"

echo "   Ville: $CITY"
echo "   Type: $VEHICLE_TYPE"
echo "   Marque: $BRAND"
echo "   Modèle: $MODEL"
echo "   Couleur: $COLOR"
echo "   Année: $YEAR"
echo "   Plaque: $PLATE_NUMBER"
echo ""

# Créer les données du véhicule
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

# Envoyer la requête d'enregistrement du véhicule
echo "📤 Enregistrement du véhicule..."
vehicle_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d "$vehicle_data")

vehicle_http_code=$(echo "$vehicle_response" | tail -n1)
vehicle_response_body=$(echo "$vehicle_response" | head -n -1)

echo "📥 Réponse (HTTP $vehicle_http_code):"
echo "$vehicle_response_body" | jq . 2>/dev/null || echo "$vehicle_response_body"
echo ""

# Vérifier si l'enregistrement a réussi
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

# Étape 2: Upload de la photo de profil (optionnel)
echo "📸 ÉTAPE 2A : Upload de la photo de profil (optionnel)"
echo "====================================================="
read -p "Voulez-vous uploader une photo de profil ? (y/n): " upload_photo

photo_path=""
if [[ $upload_photo =~ ^[Yy]$ ]]; then
    read -p "Chemin vers l'image (JPG, PNG, GIF, max 5MB): " image_path
    
    if [ -f "$image_path" ]; then
        echo ""
        echo "📤 Upload de la photo..."
        
        photo_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/upload/profile-photo \
          -F "file=@$image_path")
        
        photo_http_code=$(echo "$photo_response" | tail -n1)
        photo_response_body=$(echo "$photo_response" | head -n -1)
        
        echo "📥 Réponse upload photo (HTTP $photo_http_code):"
        echo "$photo_response_body" | jq . 2>/dev/null || echo "$photo_response_body"
        echo ""
        
        if [ "$photo_http_code" = "201" ]; then
            photo_path=$(echo "$photo_response_body" | jq -r '.photoPath' 2>/dev/null)
            echo "✅ Photo uploadée avec succès !"
            echo "   Chemin: $photo_path"
        else
            echo "❌ Erreur lors de l'upload de la photo"
        fi
    else
        echo "❌ Fichier non trouvé: $image_path"
    fi
fi

# Étape 3: Upload du document d'identité
echo ""
echo "📄 ÉTAPE 2B : Upload du document d'identité"
echo "=========================================="
read -p "Chemin vers le document d'identité (JPG, PNG, PDF, max 10MB): " document_path

if [ ! -f "$document_path" ]; then
    echo "❌ Fichier non trouvé: $document_path"
    exit 1
fi

echo ""
echo "📤 Upload du document d'identité..."
document_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/upload/document \
  -F "file=@$document_path")

document_http_code=$(echo "$document_response" | tail -n1)
document_response_body=$(echo "$document_response" | head -n -1)

echo "📥 Réponse upload document (HTTP $document_http_code):"
echo "$document_response_body" | jq . 2>/dev/null || echo "$document_response_body"
echo ""

if [ "$document_http_code" != "201" ]; then
    echo "❌ Erreur lors de l'upload du document"
    exit 1
fi

document_path=$(echo "$document_response_body" | jq -r '.documentPath' 2>/dev/null)
echo "✅ Document uploadé avec succès !"
echo "   Chemin: $document_path"

# Étape 4: Enregistrement du chauffeur
echo ""
echo "👤 ÉTAPE 2C : Enregistrement du chauffeur"
echo "========================================"

# Données du chauffeur
FULL_NAME="Jean Dupont"
PHONE="+33123456788"
LICENSE_NUMBER="123456789012345"

echo "   Nom complet: $FULL_NAME"
echo "   Téléphone: $PHONE"
echo "   Numéro de permis: $LICENSE_NUMBER"
echo "   Photo: ${photo_path:-'Aucune'}"
echo "   Document: $document_path"
echo ""

# Créer les données du chauffeur
driver_data=$(cat <<EOF
{
  "fullName": "$FULL_NAME",
  "phone": "$PHONE",
  "licenseNumber": "$LICENSE_NUMBER",
  "identityDocument": "$document_path"
EOF
)

# Ajouter la photo si uploadée
if [ -n "$photo_path" ]; then
    driver_data=$(echo "$driver_data" | sed 's/}$/,/')
    driver_data="$driver_data
  \"profilePhoto\": \"$photo_path\"
}"
else
    driver_data="$driver_data
}"
fi

# Envoyer la requête d'enregistrement du chauffeur
echo "📤 Enregistrement du chauffeur..."
driver_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/drivers/register-driver/$vehicle_id \
  -H "Content-Type: application/json" \
  -d "$driver_data")

driver_http_code=$(echo "$driver_response" | tail -n1)
driver_response_body=$(echo "$driver_response" | head -n -1)

echo "📥 Réponse (HTTP $driver_http_code):"
echo "$driver_response_body" | jq . 2>/dev/null || echo "$driver_response_body"
echo ""

if [ "$driver_http_code" = "201" ]; then
    driver_id=$(echo "$driver_response_body" | jq -r '.driver.id' 2>/dev/null)
    echo "🎉 Inscription du chauffeur réussie !"
    echo ""
    echo "📋 Récapitulatif :"
    echo "   ID Chauffeur: $driver_id"
    echo "   ID Véhicule: $vehicle_id"
    echo "   Nom: $FULL_NAME"
    echo "   Téléphone: $PHONE"
    echo "   Permis: $LICENSE_NUMBER"
    echo "   Véhicule: $BRAND $MODEL ($PLATE_NUMBER)"
    echo ""
    echo "✅ Le chauffeur est maintenant enregistré et prêt à travailler !"
    
    # Vérifier le statut final
    echo ""
    echo "🔄 Vérification du statut final..."
    status_response=$(curl -s -X GET http://localhost:3000/drivers/status/$driver_id)
    echo "📥 Statut du chauffeur:"
    echo "$status_response" | jq . 2>/dev/null || echo "$status_response"
else
    echo "❌ Erreur lors de l'enregistrement du chauffeur"
fi

echo ""
echo "🔄 Test terminé !" 