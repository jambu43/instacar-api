#!/bin/bash

echo "🧪 Test de la configuration email - InstaCar API"
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

# Test d'inscription avec un email unique
EMAIL="test.email.$(date +%s)@example.com"
NAME="Test Email"
PHONE="+33123456789"
GENDER="MALE"

echo "📝 Test d'inscription avec envoi d'email"
echo "======================================="
echo "   Email: $EMAIL"
echo "   Nom: $NAME"
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

# Vérifier les logs de l'application pour voir si l'email a été envoyé
echo "🔍 Vérification des logs de l'application..."
echo "   Regarde les logs de l'application pour voir :"
echo "   - Si l'email a été envoyé avec succès"
echo "   - Si l'email a été simulé"
echo "   - Le code OTP généré"
echo ""

# Récupérer le code OTP depuis la base de données
echo "🔐 Récupération du code OTP depuis la base de données..."
echo "   Exécute cette commande pour voir le code OTP :"
echo "   npx prisma studio"
echo "   Puis va dans la table OtpCode et cherche le code pour l'utilisateur $user_id"
echo ""

echo "📋 Instructions pour vérifier l'email :"
echo "   1. Vérifie ta boîte mail : $EMAIL"
echo "   2. Regarde dans les spams"
echo "   3. Vérifie les logs de l'application"
echo "   4. Si l'email n'arrive pas, vérifie la configuration Gmail"
echo ""

echo "🔄 Pour tester avec ton vrai email :"
echo "   Modifie le fichier .env avec :"
echo "   EMAIL_USER=\"ambujoel@gmail.com\""
echo "   EMAIL_PASS=\"ton-mot-de-passe-d-application\""
echo "   Puis redémarre l'application"
echo ""

echo "✅ Test terminé !" 