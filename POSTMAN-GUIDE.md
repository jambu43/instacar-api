# 📮 Guide Postman - InstaCar API

Ce guide vous aide à configurer et utiliser Postman correctement avec l'API InstaCar.

## 🚨 Erreur 500 - Solutions Postman

Si vous obtenez une erreur 500 dans Postman, suivez ce guide étape par étape.

### ✅ Configuration Postman correcte

#### 1. **Enregistrement d'un véhicule**

**URL :**
```
POST http://localhost:3000/drivers/register-vehicle
```

**Headers :**
```
Content-Type: application/json
```

**Body (raw JSON) :**
```json
{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Rouge",
  "year": 2021,
  "plateNumber": "TEST-001"
}
```

**⚠️ Points importants :**
- Pas de virgule finale après le dernier champ
- Guillemets doubles obligatoires
- Tous les champs sont requis

#### 2. **Enregistrement d'un chauffeur**

**URL :**
```
POST http://localhost:3000/drivers/register-driver/{vehicleId}
```

**Remplacez `{vehicleId}` par l'ID réel du véhicule obtenu à l'étape 1.**

**Headers :**
```
Content-Type: application/json
```

**Body (raw JSON) :**
```json
{
  "fullName": "Jean Dupont",
  "phone": "+33123456789",
  "licenseNumber": "123456789012345",
  "identityDocument": "documents/test.pdf"
}
```

### 🔍 Erreurs courantes et solutions

#### **Erreur 400 - Bad Request**

**Causes possibles :**
1. **JSON invalide** - Virgule finale ou syntaxe incorrecte
2. **Content-Type manquant** - Header non défini
3. **Données manquantes** - Champs requis non fournis

**Solutions :**
```json
// ❌ Incorrect (virgule finale)
{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Rouge",
  "year": 2021,
  "plateNumber": "TEST-001",
}

// ✅ Correct
{
  "city": "Paris",
  "vehicleType": "PROPRIETAIRE",
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Rouge",
  "year": 2021,
  "plateNumber": "TEST-001"
}
```

#### **Erreur 409 - Conflict**

**Causes possibles :**
1. **Numéro de téléphone déjà utilisé**
2. **Numéro de permis déjà utilisé**
3. **Plaque d'immatriculation déjà utilisée**

**Solutions :**
- Utilisez des données uniques
- Vérifiez les données existantes avec les scripts de diagnostic

#### **Erreur 404 - Not Found**

**Causes possibles :**
1. **URL incorrecte**
2. **Méthode HTTP incorrecte**
3. **ID de véhicule inexistant**

**Solutions :**
- Vérifiez l'URL exacte
- Utilisez la méthode POST
- Vérifiez que l'ID du véhicule existe

### 📋 Checklist Postman

#### **Configuration de base**
- [ ] URL correcte : `http://localhost:3000/drivers/register-vehicle`
- [ ] Méthode : `POST`
- [ ] Headers : `Content-Type: application/json`
- [ ] Body : `raw` avec type `JSON`

#### **Données du véhicule**
- [ ] `city` : Ville (ex: "Paris")
- [ ] `vehicleType` : "PROPRIETAIRE" ou "LOCATION"
- [ ] `brand` : Marque du véhicule
- [ ] `model` : Modèle du véhicule
- [ ] `color` : Couleur du véhicule
- [ ] `year` : Année (nombre)
- [ ] `plateNumber` : Plaque unique

#### **Données du chauffeur**
- [ ] URL avec ID : `http://localhost:3000/drivers/register-driver/{vehicleId}`
- [ ] `fullName` : Nom complet
- [ ] `phone` : Numéro unique (format international)
- [ ] `licenseNumber` : Numéro de permis unique
- [ ] `identityDocument` : Chemin du document

### 🧪 Tests automatiques

#### **Script de diagnostic**
```bash
./test-postman-request.sh
```

#### **Test des erreurs spécifiques**
```bash
./test-postman-specific-errors.sh
```

#### **Test complet**
```bash
./debug-driver-registration.sh
```

### 🔧 Configuration Postman avancée

#### **Variables d'environnement**
1. Créez un environnement "InstaCar Local"
2. Ajoutez la variable `baseUrl` = `http://localhost:3000`
3. Utilisez `{{baseUrl}}/drivers/register-vehicle`

#### **Tests automatiques**
```javascript
// Test de succès
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
});

// Sauvegarder l'ID du véhicule
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("vehicleId", jsonData.vehicle.id);
}
```

#### **Pré-requêtes**
```javascript
// Générer des données uniques
const timestamp = Date.now();
pm.environment.set("uniquePhone", `+331234567${timestamp.toString().slice(-4)}`);
pm.environment.set("uniqueLicense", `123456789${timestamp.toString().slice(-6)}`);
pm.environment.set("uniquePlate", `TEST-${timestamp}`);
```

### 📝 Exemples de requêtes

#### **Exemple 1 : Inscription complète**
```bash
# Étape 1 : Véhicule
curl -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Paris",
    "vehicleType": "PROPRIETAIRE",
    "brand": "Toyota",
    "model": "Corolla",
    "color": "Rouge",
    "year": 2021,
    "plateNumber": "TEST-001"
  }'

# Étape 2 : Chauffeur
curl -X POST http://localhost:3000/drivers/register-driver/1 \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jean Dupont",
    "phone": "+33123456789",
    "licenseNumber": "123456789012345",
    "identityDocument": "documents/test.pdf"
  }'
```

#### **Exemple 2 : Avec données uniques**
```bash
# Générer des données uniques
TIMESTAMP=$(date +%s)
PHONE="+331234567${TIMESTAMP: -4}"
LICENSE="123456789${TIMESTAMP: -6}"
PLATE="TEST-${TIMESTAMP}"

# Requête avec données uniques
curl -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d "{
    \"city\": \"Paris\",
    \"vehicleType\": \"PROPRIETAIRE\",
    \"brand\": \"Toyota\",
    \"model\": \"Corolla\",
    \"color\": \"Rouge\",
    \"year\": 2021,
    \"plateNumber\": \"$PLATE\"
  }"
```

### 🆘 Dépannage

#### **Si l'erreur 500 persiste :**
1. **Vérifiez les logs** de l'application
2. **Testez avec curl** pour confirmer que l'API fonctionne
3. **Utilisez les scripts de diagnostic**
4. **Vérifiez la configuration Postman**

#### **Commandes utiles :**
```bash
# Vérifier que l'API fonctionne
curl -s http://localhost:3000

# Tester une requête simple
curl -X POST http://localhost:3000/drivers/register-vehicle \
  -H "Content-Type: application/json" \
  -d '{"city":"Paris","vehicleType":"PROPRIETAIRE","brand":"Test","model":"Test","color":"Rouge","year":2021,"plateNumber":"TEST-CURL"}'

# Vérifier les données existantes
psql postgresql://root:root@localhost:5432/instacar -c "SELECT phone, fullName FROM \"Driver\" ORDER BY id;"
```

### 📞 Support

Si vous continuez à avoir des problèmes :
1. **Copiez-collez** la requête exacte de Postman
2. **Incluez** les headers et le body
3. **Fournissez** le message d'erreur complet
4. **Testez** d'abord avec curl pour confirmer 