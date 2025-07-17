#!/bin/bash

echo "🚀 Configuration Gmail pour InstaCar API"
echo "========================================"
echo ""

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env non trouvé. Création..."
    cp .env.example .env
fi

echo "📧 Configuration de l'email Gmail"
echo ""

# Demander l'email
read -p "Entrez votre adresse Gmail: " email

# Demander le mot de passe d'application
echo ""
echo "🔑 Mot de passe d'application Gmail"
echo "Si vous n'en avez pas, suivez ces étapes :"
echo "1. Allez sur https://myaccount.google.com"
echo "2. Sécurité > Validation en 2 étapes (activez-la)"
echo "3. Sécurité > Mots de passe d'application"
echo "4. Sélectionnez 'Autre' et nommez-le 'InstaCar API'"
echo "5. Copiez le mot de passe de 16 caractères"
echo ""
read -p "Entrez votre mot de passe d'application (16 caractères): " password

# Vérifier que le mot de passe fait 16 caractères
if [ ${#password} -ne 16 ]; then
    echo "❌ Erreur: Le mot de passe d'application doit faire exactement 16 caractères"
    echo "   Votre mot de passe fait ${#password} caractères"
    exit 1
fi

# Mettre à jour le fichier .env
echo ""
echo "📝 Mise à jour du fichier .env..."

# Sauvegarder l'ancien fichier
cp .env .env.backup

# Mettre à jour les variables email
sed -i '' "s/EMAIL_USER=.*/EMAIL_USER=\"$email\"/" .env
sed -i '' "s/EMAIL_PASS=.*/EMAIL_PASS=\"$password\"/" .env

echo "✅ Configuration Gmail mise à jour !"
echo ""
echo "📋 Récapitulatif :"
echo "   Email: $email"
echo "   Mot de passe: ${password:0:4}****${password: -4}"
echo ""
echo "🔄 Redémarrez l'application pour tester :"
echo "   pnpm run start:dev"
echo ""
echo "📧 Test d'envoi d'email :"
echo "   curl -X POST http://localhost:3000/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"name\":\"Test User\",\"email\":\"$email\",\"phone\":\"+33123456789\",\"gender\":\"MALE\"}'"
echo ""
echo "💾 Sauvegarde créée: .env.backup" 