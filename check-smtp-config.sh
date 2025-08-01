#!/bin/bash

echo "🔍 Vérification de la configuration SMTP..."
echo "=========================================="

# Vérifier les variables d'environnement
echo "📋 Variables d'environnement SMTP :"
echo "-----------------------------------"

if [ -z "$SMTP_HOST" ]; then
    echo "❌ SMTP_HOST: NON DÉFINI (utilisera smtp.gmail.com par défaut)"
else
    echo "✅ SMTP_HOST: $SMTP_HOST"
fi

if [ -z "$SMTP_PORT" ]; then
    echo "❌ SMTP_PORT: NON DÉFINI (utilisera 587 par défaut)"
else
    echo "✅ SMTP_PORT: $SMTP_PORT"
fi

if [ -z "$SMTP_USER" ]; then
    echo "❌ SMTP_USER: NON DÉFINI (ERREUR CRITIQUE)"
else
    echo "✅ SMTP_USER: ${SMTP_USER:0:3}***@***"
fi

if [ -z "$SMTP_PASS" ]; then
    echo "❌ SMTP_PASS: NON DÉFINI (ERREUR CRITIQUE)"
else
    echo "✅ SMTP_PASS: ***configured***"
fi

echo ""
echo "🔧 Configuration recommandée pour Gmail :"
echo "----------------------------------------"
echo "SMTP_HOST=smtp.gmail.com"
echo "SMTP_PORT=587"
echo "SMTP_USER=votre-email@gmail.com"
echo "SMTP_PASS=votre-mot-de-passe-d-application"
echo ""
echo "📝 Note : Pour Gmail, utilisez un mot de passe d'application, pas votre mot de passe principal"
echo "   Voir : https://support.google.com/accounts/answer/185833"
echo ""

# Vérifier si le fichier .env existe
if [ -f ".env" ]; then
    echo "📁 Fichier .env détecté"
    if grep -q "SMTP_" .env; then
        echo "✅ Variables SMTP trouvées dans .env"
    else
        echo "❌ Aucune variable SMTP trouvée dans .env"
    fi
else
    echo "❌ Fichier .env non trouvé"
fi

echo ""
echo "🚀 Pour tester la configuration :"
echo "--------------------------------"
echo "1. Assurez-vous que les variables SMTP_USER et SMTP_PASS sont définies"
echo "2. Redémarrez votre application NestJS"
echo "3. Vérifiez les logs pour les messages de validation SMTP"
echo ""

# Test de connexion simple (si les variables sont définies)
if [ ! -z "$SMTP_USER" ] && [ ! -z "$SMTP_PASS" ]; then
    echo "🧪 Test de connexion SMTP..."
    echo "Tentative de connexion à ${SMTP_HOST:-smtp.gmail.com}:${SMTP_PORT:-587}"
    echo "Avec l'utilisateur : ${SMTP_USER:0:3}***@***"
    echo ""
    echo "⚠️  Si vous voyez 'Missing credentials for PLAIN', cela signifie :"
    echo "   - Les identifiants sont vides ou incorrects"
    echo "   - Le serveur SMTP nécessite une authentification différente"
    echo "   - Pour Gmail, vérifiez que vous utilisez un mot de passe d'application"
else
    echo "❌ Impossible de tester la connexion : variables SMTP_USER et/ou SMTP_PASS manquantes"
fi 