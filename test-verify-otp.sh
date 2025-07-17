#!/bin/bash

echo "🔐 Test de vérification OTP - InstaCar API"
echo "=========================================="
echo ""

# Demander les informations
read -p "Entrez l'email utilisé pour l'inscription: " email
read -p "Entrez le code OTP reçu: " otp_code

# Vérifier que le code fait 5 chiffres
if [[ ! "$otp_code" =~ ^[0-9]{5}$ ]]; then
    echo "❌ Le code OTP doit faire exactement 5 chiffres"
    exit 1
fi

echo ""
echo "🔍 Vérification du code OTP..."
echo "   Email: $email"
echo "   Code: $otp_code"
echo ""

# Créer les données de vérification
verify_data=$(cat <<EOF
{
  "email": "$email",
  "code": "$otp_code"
}
EOF
)

# Envoyer la requête de vérification
response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "$verify_data")

# Extraire le code de statut et la réponse
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | head -n -1)

echo "📥 Réponse du serveur (HTTP $http_code):"
echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
echo ""

# Analyser la réponse
if [ "$http_code" = "200" ]; then
    echo "✅ Vérification OTP réussie !"
    echo "🎉 Le compte est maintenant activé"
    echo ""
    echo "📋 Informations du compte :"
    echo "$response_body" | jq '.user' 2>/dev/null || echo "Utilisateur vérifié"
else
    echo "❌ Erreur lors de la vérification"
    echo ""
    echo "🔍 Causes possibles :"
    echo "   - Code OTP incorrect"
    echo "   - Code OTP expiré (10 minutes)"
    echo "   - Email incorrect"
    echo "   - Code déjà utilisé"
fi

echo ""
echo "🔄 Pour renvoyer un nouveau code OTP :"
echo "   curl -X POST http://localhost:3000/auth/resend-otp \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"$email\"}'" 