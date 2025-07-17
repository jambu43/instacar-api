#!/bin/bash

echo "🔄 Test automatisé d'inscription complète avec photo - InstaCar API"
echo "=================================================================="
echo ""

# Vérifier si l'application est démarrée
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ L'application n'est pas démarrée"
    echo "   Démarrez-la avec: pnpm run start:dev"
    exit 1
fi

echo "✅ Application démarrée sur http://localhost:3000"
echo ""

# Données de test
NAME="Test User"
EMAIL="test.photo.$(date +%s)@example.com"
PHONE="+33123456789"
GENDER="MALE"
ADDRESS="123 Rue de la Paix"
CITY="Paris"
COMMUNE="Le Marais"

echo "📝 ÉTAPE 1 : Inscription de base"
echo "================================"
echo "   Nom: $NAME"
echo "   Email: $EMAIL"
echo "   Téléphone: $PHONE"
echo "   Genre: $GENDER"
echo ""

# Créer les données d'inscription
register_data=$(cat <<EOF
{
  "name": "$NAME",
  "email": "$EMAIL",
  "phone": "$PHONE",
  "gender": "$GENDER"
}
EOF
)

# Envoyer la requête d'inscription
response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "$register_data")

# Extraire le code de statut et la réponse
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | head -n -1)

echo "📥 Réponse (HTTP $http_code):"
echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
echo ""

# Vérifier si l'inscription a réussi
if [ "$http_code" != "201" ]; then
    echo "❌ Erreur lors de l'inscription"
    exit 1
fi

# Extraire l'ID utilisateur
user_id=$(echo "$response_body" | jq -r '.userId' 2>/dev/null)
if [ "$user_id" = "null" ] || [ -z "$user_id" ]; then
    echo "❌ Impossible de récupérer l'ID utilisateur"
    exit 1
fi

echo "✅ Inscription réussie ! ID utilisateur: $user_id"
echo "📧 Un code OTP a été envoyé à $EMAIL"
echo ""

# Récupérer le code OTP depuis la base de données (simulation)
echo "🔐 Récupération du code OTP depuis la base de données..."
echo "   (En mode développement, le code est affiché dans les logs)"
echo ""

# Simuler la vérification OTP (en mode développement, on peut utiliser un code fixe)
echo "📤 Vérification du code OTP (simulation)..."
verify_data=$(cat <<EOF
{
  "email": "$EMAIL",
  "code": "12345"
}
EOF
)

verify_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "$verify_data")

verify_http_code=$(echo "$verify_response" | tail -n1)
verify_response_body=$(echo "$verify_response" | head -n -1)

echo "📥 Réponse vérification (HTTP $verify_http_code):"
echo "$verify_response_body" | jq . 2>/dev/null || echo "$verify_response_body"
echo ""

if [ "$verify_http_code" != "200" ]; then
    echo "❌ Erreur lors de la vérification OTP"
    echo "   Vérifiez les logs de l'application pour le code OTP réel"
    exit 1
fi

echo "✅ Vérification OTP réussie !"
echo ""

# Étape 2 : Upload de photo
echo "📸 ÉTAPE 2A : Upload de photo de profil"
echo "======================================="

# Créer une image de test simple (1x1 pixel PNG)
echo -n -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x07tIME\x07\xe7\x0c\x1a\x0e\x1c\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xf5\xa5\xa5\xd4\x00\x00\x00\x00IEND\xaeB`\x82' > test-profile-photo.png

echo "📤 Upload de la photo..."
upload_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/upload/profile-photo \
  -F "file=@test-profile-photo.png")

upload_http_code=$(echo "$upload_response" | tail -n1)
upload_response_body=$(echo "$upload_response" | head -n -1)

echo "📥 Réponse upload (HTTP $upload_http_code):"
echo "$upload_response_body" | jq . 2>/dev/null || echo "$upload_response_body"
echo ""

if [ "$upload_http_code" = "201" ]; then
    photo_path=$(echo "$upload_response_body" | jq -r '.photoPath' 2>/dev/null)
    photo_url=$(echo "$upload_response_body" | jq -r '.photoUrl' 2>/dev/null)
    echo "✅ Photo uploadée avec succès !"
    echo "   Chemin: $photo_path"
    echo "   URL: $photo_url"
else
    echo "❌ Erreur lors de l'upload de la photo"
    photo_path=""
fi

# Étape 3 : Compléter le profil
echo ""
echo "📝 ÉTAPE 2B : Compléter le profil"
echo "================================"
echo "   Adresse: $ADDRESS"
echo "   Ville: $CITY"
echo "   Commune: $COMMUNE"
echo "   Photo: ${photo_path:-'Aucune'}"
echo ""

# Créer les données de complétion du profil
complete_data=$(cat <<EOF
{
  "address": "$ADDRESS",
  "city": "$CITY",
  "commune": "$COMMUNE"
EOF
)

# Ajouter la photo si uploadée
if [ -n "$photo_path" ]; then
    complete_data=$(echo "$complete_data" | sed 's/}$/,/')
    complete_data="$complete_data
  \"profilePhoto\": \"$photo_path\"
}"
else
    complete_data="$complete_data
}"
fi

# Envoyer la requête de complétion du profil
complete_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/auth/complete-profile/$user_id \
  -H "Content-Type: application/json" \
  -d "$complete_data")

complete_http_code=$(echo "$complete_response" | tail -n1)
complete_response_body=$(echo "$complete_response" | head -n -1)

echo "📥 Réponse complétion profil (HTTP $complete_http_code):"
echo "$complete_response_body" | jq . 2>/dev/null || echo "$complete_response_body"
echo ""

if [ "$complete_http_code" = "200" ]; then
    echo "🎉 Inscription complète réussie !"
    echo ""
    echo "📋 Récapitulatif du compte :"
    echo "   ID: $user_id"
    echo "   Nom: $NAME"
    echo "   Email: $EMAIL"
    echo "   Téléphone: $PHONE"
    echo "   Genre: $GENDER"
    echo "   Adresse: $ADDRESS"
    echo "   Ville: $CITY"
    echo "   Commune: $COMMUNE"
    if [ -n "$photo_url" ]; then
        echo "   Photo: $photo_url"
    else
        echo "   Photo: Aucune"
    fi
    echo ""
    echo "✅ Le compte est maintenant complet et prêt à être utilisé !"
else
    echo "❌ Erreur lors de la complétion du profil"
fi

# Vérifier le statut final du profil
echo ""
echo "🔄 Vérification du statut final du profil..."
status_response=$(curl -s -X GET http://localhost:3000/auth/profile-status/$user_id)
echo "📥 Statut du profil:"
echo "$status_response" | jq . 2>/dev/null || echo "$status_response"

# Nettoyage
echo ""
echo "=== Nettoyage ==="
rm -f test-profile-photo.png
echo "Fichiers temporaires supprimés"

echo ""
echo "🔄 Test terminé !" 