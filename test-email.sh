#!/bin/bash

echo "📧 Test d'envoi d'email OTP - InstaCar API"
echo "=========================================="
echo ""

# Vérifier si l'application est démarrée
echo "🔍 Vérification de l'application..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Application déjà démarrée sur http://localhost:3000"
else
    echo "🚀 Démarrage de l'application..."
    echo "   L'application va démarrer en arrière-plan..."
    echo "   Attendez quelques secondes..."
    
    # Démarrer l'application en arrière-plan
    pnpm run start:dev > app.log 2>&1 &
    APP_PID=$!
    
    # Attendre que l'application démarre
    echo "⏳ Attente du démarrage..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Application démarrée avec succès !"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ L'application n'a pas démarré dans les temps"
            kill $APP_PID 2>/dev/null
            exit 1
        fi
        sleep 1
        echo -n "."
    done
    echo ""
fi

# Demander l'email de test
echo ""
echo "📧 Configuration du test"
echo "======================="
read -p "Entrez votre adresse email pour le test: " test_email

# Vérifier le format de l'email
if [[ ! "$test_email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    echo "❌ Format d'email invalide"
    exit 1
fi

echo ""
echo "🧪 Test d'inscription avec OTP"
echo "=============================="

# Créer les données de test
test_data=$(cat <<EOF
{
  "name": "Test User",
  "email": "$test_email",
  "phone": "+33123456789",
  "gender": "MALE"
}
EOF
)

echo "📤 Envoi de la requête d'inscription..."
echo "   Email: $test_email"
echo ""

# Envoyer la requête d'inscription
response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "$test_data")

# Extraire le code de statut et la réponse
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | head -n -1)

echo "📥 Réponse du serveur (HTTP $http_code):"
echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
echo ""

# Analyser la réponse
if [ "$http_code" = "201" ]; then
    echo "✅ Inscription réussie !"
    echo "📧 Un code OTP a été envoyé à $test_email"
    echo ""
    echo "🔍 Vérifiez :"
    echo "   1. Votre boîte email (et les spams)"
    echo "   2. Les logs de l'application pour le code OTP"
    echo ""
    echo "📋 Prochaines étapes :"
    echo "   1. Récupérez le code OTP depuis votre email"
    echo "   2. Testez la vérification avec :"
    echo "      curl -X POST http://localhost:3000/auth/verify-otp \\"
    echo "        -H 'Content-Type: application/json' \\"
    echo "        -d '{\"email\":\"$test_email\",\"code\":\"CODE_ICI\"}'"
else
    echo "❌ Erreur lors de l'inscription"
    echo "🔍 Vérifiez les logs de l'application pour plus de détails"
fi

echo ""
echo "📊 Logs de l'application :"
echo "=========================="
if [ -f app.log ]; then
    tail -n 20 app.log
else
    echo "Aucun log disponible"
fi

echo ""
echo "🛑 Pour arrêter l'application :"
echo "   pkill -f 'nest start'" 