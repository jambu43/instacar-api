#!/bin/bash

echo "🔄 Test d'inscription avec upload de photo - InstaCar API"
echo "========================================================"
echo ""

# Vérifier si l'application est démarrée
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ L'application n'est pas démarrée"
    echo "   Démarrez-la avec: pnpm run start:dev"
    exit 1
fi

echo "✅ Application démarrée sur http://localhost:3000"
echo ""

# Étape 1: Inscription initiale
echo "📝 ÉTAPE 1 : Inscription de base"
echo "================================"
read -p "Nom complet: " name
read -p "Email: " email
read -p "Téléphone: " phone
echo "Genre (MALE/FEMALE): "
select gender in "MALE" "FEMALE"; do
    if [ -n "$gender" ]; then
        break
    fi
done

echo ""
echo "📤 Envoi de l'inscription (étape 1)..."
echo "   Nom: $name"
echo "   Email: $email"
echo "   Téléphone: $phone"
echo "   Genre: $gender"
echo ""

# Créer les données d'inscription
register_data=$(cat <<EOF
{
  "name": "$name",
  "email": "$email",
  "phone": "$phone",
  "gender": "$gender"
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
echo "📧 Un code OTP a été envoyé à $email"
echo ""

# Demander le code OTP
echo "🔐 Vérification OTP"
echo "=================="
read -p "Entrez le code OTP reçu: " otp_code

echo ""
echo "📤 Vérification du code OTP..."
verify_data=$(cat <<EOF
{
  "email": "$email",
  "code": "$otp_code"
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
    exit 1
fi

echo "✅ Vérification OTP réussie !"
echo ""

# Étape 2 : Upload de photo (optionnel)
echo "📸 ÉTAPE 2A : Upload de photo de profil (optionnel)"
echo "=================================================="
read -p "Voulez-vous uploader une photo de profil ? (y/n): " upload_photo

photo_path=""
if [[ $upload_photo =~ ^[Yy]$ ]]; then
    read -p "Chemin vers l'image (JPG, PNG, GIF, max 5MB): " image_path
    
    if [ -f "$image_path" ]; then
        echo ""
        echo "📤 Upload de la photo..."
        
        upload_response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/upload/profile-photo \
          -F "file=@$image_path")
        
        upload_http_code=$(echo "$upload_response" | tail -n1)
        upload_response_body=$(echo "$upload_response" | head -n -1)
        
        echo "📥 Réponse upload (HTTP $upload_http_code):"
        echo "$upload_response_body" | jq . 2>/dev/null || echo "$upload_response_body"
        echo ""
        
        if [ "$upload_http_code" = "201" ]; then
            photo_path=$(echo "$upload_response_body" | jq -r '.photoPath' 2>/dev/null)
            echo "✅ Photo uploadée avec succès !"
            echo "   Chemin: $photo_path"
        else
            echo "❌ Erreur lors de l'upload de la photo"
        fi
    else
        echo "❌ Fichier non trouvé: $image_path"
    fi
fi

# Étape 3 : Compléter le profil
echo ""
echo "📝 ÉTAPE 2B : Compléter le profil"
echo "================================"
read -p "Adresse complète: " address
read -p "Ville: " city
read -p "Commune/Quartier: " commune

echo ""
echo "📤 Complétion du profil..."
echo "   Adresse: $address"
echo "   Ville: $city"
echo "   Commune: $commune"
echo "   Photo: ${photo_path:-'Aucune'}"
echo ""

# Créer les données de complétion du profil
complete_data=$(cat <<EOF
{
  "address": "$address",
  "city": "$city",
  "commune": "$commune"
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
    echo "   Nom: $name"
    echo "   Email: $email"
    echo "   Téléphone: $phone"
    echo "   Genre: $gender"
    echo "   Adresse: $address"
    echo "   Ville: $city"
    echo "   Commune: $commune"
    if [ -n "$photo_path" ]; then
        photo_url=$(echo "$upload_response_body" | jq -r '.photoUrl' 2>/dev/null)
        echo "   Photo: $photo_url"
    else
        echo "   Photo: Aucune"
    fi
    echo ""
    echo "✅ Le compte est maintenant complet et prêt à être utilisé !"
else
    echo "❌ Erreur lors de la complétion du profil"
fi

echo ""
echo "🔄 Pour vérifier le statut du profil :"
echo "   curl -X GET http://localhost:3000/auth/profile-status/$user_id" 