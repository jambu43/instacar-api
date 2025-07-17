#!/bin/bash

echo "📊 Vérification des logs de l'application"
echo "========================================"
echo ""

# Vérifier si l'application est en cours d'exécution
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ L'application n'est pas démarrée"
    echo "   Démarrez-la avec: pnpm run start:dev"
    exit 1
fi

echo "✅ Application démarrée sur http://localhost:3000"
echo ""

# Vérifier les processus Node.js
echo "🔍 Processus Node.js en cours d'exécution :"
ps aux | grep node | grep -v grep | head -5

echo ""
echo "📋 Logs récents (si disponibles) :"
if [ -f app.log ]; then
    echo "📄 Fichier app.log trouvé :"
    tail -n 20 app.log
else
    echo "📄 Aucun fichier de log trouvé"
    echo "   Les logs sont probablement affichés dans le terminal où l'application a été démarrée"
fi

echo ""
echo "🧪 Test d'envoi d'OTP :"
echo "======================"

# Demander l'email pour le test
read -p "Entrez un email pour tester l'envoi d'OTP: " test_email

# Envoyer la requête
echo "📤 Envoi de la requête d'inscription..."
response=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Logs\",
    \"email\": \"$test_email\",
    \"phone\": \"+33123456786\",
    \"gender\": \"MALE\"
  }")

echo "📥 Réponse : $response"
echo ""

# Vérifier si l'inscription a réussi
if echo "$response" | grep -q "success.*true"; then
    echo "✅ Inscription réussie !"
    echo ""
    echo "📧 Vérification de l'envoi d'OTP :"
    echo "   1. Vérifiez votre boîte email : $test_email"
    echo "   2. Vérifiez les spams"
    echo "   3. Regardez les logs dans le terminal où l'application a été démarrée"
    echo ""
    echo "🔍 Si Gmail n'est pas configuré, l'OTP sera affiché dans les logs :"
    echo "   [OtpService] Email simulé pour $test_email: Code OTP = XXXXX"
    echo ""
    echo "📋 Pour configurer Gmail :"
    echo "   ./setup-gmail.sh"
else
    echo "❌ Erreur lors de l'inscription"
    echo "   Réponse : $response"
fi

echo ""
echo "🔄 Pour voir les logs en temps réel :"
echo "   Dans le terminal où l'application a été démarrée, vous devriez voir les logs" 