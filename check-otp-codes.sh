#!/bin/bash

echo "🔍 Vérification des codes OTP en base de données"
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

# Demander l'email de l'utilisateur
read -p "Entrez l'email de l'utilisateur: " user_email

if [ -z "$user_email" ]; then
    echo "❌ Email requis"
    exit 1
fi

echo ""
echo "🔍 Recherche des codes OTP pour: $user_email"
echo ""

# Utiliser Prisma pour récupérer les informations
echo "📊 Codes OTP récents pour cet utilisateur :"
echo "   (Exécutez ces commandes dans un autre terminal)"

echo ""
echo "1. Ouvrir Prisma Studio :"
echo "   npx prisma studio"
echo ""

echo "2. Ou utiliser la CLI Prisma :"
echo "   npx prisma db execute --stdin <<< \""
echo "   SELECT u.email, o.code, o.type, o.expiresAt, o.isUsed, o.createdAt"
echo "   FROM \"User\" u"
echo "   JOIN \"OtpCode\" o ON u.id = o.userId"
echo "   WHERE u.email = '$user_email'"
echo "   ORDER BY o.createdAt DESC"
echo "   LIMIT 5;"
echo "   \""
echo ""

echo "3. Ou vérifier directement avec psql :"
echo "   psql postgresql://root:root@localhost:5432/instacar -c \""
echo "   SELECT u.email, o.code, o.type, o.expiresAt, o.isUsed, o.createdAt"
echo "   FROM \"User\" u"
echo "   JOIN \"OtpCode\" o ON u.id = o.userId"
echo "   WHERE u.email = '$user_email'"
echo "   ORDER BY o.createdAt DESC"
echo "   LIMIT 5;"
echo "   \""
echo ""

echo "📋 Instructions :"
echo "   1. Copie une des commandes ci-dessus"
echo "   2. Exécute-la dans un nouveau terminal"
echo "   3. Regarde le code OTP le plus récent"
echo "   4. Utilise ce code pour vérifier l'inscription"
echo ""

echo "✅ Script terminé !" 