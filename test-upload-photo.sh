#!/bin/bash

# Script de test pour l'upload de photos de profil
BASE_URL="http://localhost:3000"

echo "=== Test d'upload de photo de profil ==="
echo

# Test 1: Upload d'une photo de profil
echo "1. Upload d'une photo de profil..."
echo "Création d'une image de test..."

# Créer une image de test simple (1x1 pixel PNG)
echo -n -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x07tIME\x07\xe7\x0c\x1a\x0e\x1c\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xf5\xa5\xa5\xd4\x00\x00\x00\x00IEND\xaeB`\x82' > test-image.png

# Upload de la photo
UPLOAD_RESPONSE=$(curl -s -X POST \
  -F "file=@test-image.png" \
  "${BASE_URL}/upload/profile-photo")

echo "Réponse d'upload:"
echo "$UPLOAD_RESPONSE" | jq '.'

# Extraire le chemin de la photo
PHOTO_PATH=$(echo "$UPLOAD_RESPONSE" | jq -r '.photoPath')
PHOTO_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.photoUrl')

echo
echo "Chemin de la photo: $PHOTO_PATH"
echo "URL de la photo: $PHOTO_URL"

# Test 2: Vérifier que la photo est accessible
echo
echo "2. Vérification de l'accessibilité de la photo..."
if [ "$PHOTO_URL" != "null" ]; then
  PHOTO_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$PHOTO_URL")
  if [ "$PHOTO_CHECK" = "200" ]; then
    echo "✅ Photo accessible avec succès"
  else
    echo "❌ Erreur d'accès à la photo (HTTP $PHOTO_CHECK)"
  fi
else
  echo "❌ URL de photo invalide"
fi

# Test 3: Test avec un fichier invalide
echo
echo "3. Test avec un fichier invalide..."
echo "test content" > invalid-file.txt

INVALID_RESPONSE=$(curl -s -X POST \
  -F "file=@invalid-file.txt" \
  "${BASE_URL}/upload/profile-photo")

echo "Réponse pour fichier invalide:"
echo "$INVALID_RESPONSE" | jq '.'

# Test 4: Test sans fichier
echo
echo "4. Test sans fichier..."
NO_FILE_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/upload/profile-photo")

echo "Réponse sans fichier:"
echo "$NO_FILE_RESPONSE" | jq '.'

# Nettoyage
echo
echo "=== Nettoyage ==="
rm -f test-image.png invalid-file.txt
echo "Fichiers temporaires supprimés"

echo
echo "=== Test terminé ===" 