# 📱 Guide d'Intégration - Système OTP InstaCar API

## 🎯 Vue d'Ensemble

Ce guide vous accompagne dans l'intégration du système d'authentification par OTP dans vos applications mobile et web.

## 🔧 Configuration de Base

### Variables d'Environnement

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
APP_KEY=instacar-secret-key-2024

# Production
# API_BASE_URL=https://api.instacar.com/api
# APP_KEY=your-production-app-key
```

## 📱 Intégration React Native

### 1. Installation des Dépendances

```bash
npm install @react-native-async-storage/async-storage
npm install react-native-vector-icons
npm install react-native-elements
```

### 2. Service d'Authentification

```javascript
// services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
    this.appKey = 'instacar-secret-key-2024';
  }

  // Demander un code OTP
  async requestOtp(email, userData = null) {
    try {
      const payload = { email };
      if (userData) {
        Object.assign(payload, userData);
      }

      const response = await fetch(`${this.baseUrl}/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'instakey': this.appKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la demande OTP');
      }

      return data;
    } catch (error) {
      console.error('Erreur requestOtp:', error);
      throw error;
    }
  }

  // Vérifier le code OTP
  async verifyOtp(email, otpCode) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'instakey': this.appKey,
        },
        body: JSON.stringify({ email, otpCode }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la vérification OTP');
      }

      // Stocker les tokens
      if (data.success) {
        await AsyncStorage.setItem('accessToken', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Erreur verifyOtp:', error);
      throw error;
    }
  }

  // Renvoyer un code OTP
  async resendOtp(email) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'instakey': this.appKey,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du renvoi OTP');
      }

      return data;
    } catch (error) {
      console.error('Erreur resendOtp:', error);
      throw error;
    }
  }

  // Requête authentifiée
  async makeAuthenticatedRequest(endpoint, options = {}) {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'instakey': this.appKey,
          'Authorization': `Bearer ${accessToken}`,
          ...options.headers,
        },
      });

      // Si le token a expiré, essayer de le renouveler
      if (response.status === 401) {
        const newToken = await this.refreshToken();
        if (newToken) {
          return fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'instakey': this.appKey,
              'Authorization': `Bearer ${newToken}`,
              ...options.headers,
            },
          });
        }
      }

      return response;
    } catch (error) {
      console.error('Erreur makeAuthenticatedRequest:', error);
      throw error;
    }
  }

  // Renouveler le token
  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('Refresh token manquant');
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'instakey': this.appKey,
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      
      if (data.success) {
        await AsyncStorage.setItem('accessToken', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
        return data.accessToken;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur refreshToken:', error);
      await this.logout();
      return null;
    }
  }

  // Déconnexion
  async logout() {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      if (accessToken) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'instakey': this.appKey,
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Erreur logout:', error);
    } finally {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
    }
  }

  // Vérifier si l'utilisateur est connecté
  async isAuthenticated() {
    const accessToken = await AsyncStorage.getItem('accessToken');
    return !!accessToken;
  }

  // Récupérer les informations utilisateur
  async getUser() {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export default new AuthService();
```

### 3. Écran de Connexion

```javascript
// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AuthService from '../services/AuthService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const requestOtp = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez saisir votre email');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.requestOtp(email);
      
      if (result.success) {
        setOtpSent(true);
        startCountdown();
        Alert.alert(
          'Code OTP envoyé',
          result.isNewUser 
            ? 'Un code OTP a été envoyé pour créer votre compte'
            : 'Un code OTP a été envoyé pour vous connecter'
        );
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode) {
      Alert.alert('Erreur', 'Veuillez saisir le code OTP');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.verifyOtp(email, otpCode);
      
      if (result.success) {
        Alert.alert('Succès', 'Connexion réussie !');
        // Naviguer vers l'écran principal
        navigation.replace('Main');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    try {
      const result = await AuthService.resendOtp(email);
      
      if (result.success) {
        startCountdown();
        Alert.alert('Succès', 'Code OTP renvoyé');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>InstaCar</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!otpSent}
        />

        {!otpSent ? (
          <TouchableOpacity
            style={styles.button}
            onPress={requestOtp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Demander le code OTP</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Code OTP (6 chiffres)"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="numeric"
              maxLength={6}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={verifyOtp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Vérifier le code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resendButton, countdown > 0 && styles.disabledButton]}
              onPress={resendOtp}
              disabled={countdown > 0 || isLoading}
            >
              <Text style={styles.resendText}>
                {countdown > 0 
                  ? `Renvoyer dans ${countdown}s` 
                  : 'Renvoyer le code'
                }
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#007bff',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    padding: 10,
    alignItems: 'center',
  },
  resendText: {
    color: '#007bff',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default LoginScreen;
```

### 4. Écran d'Inscription

```javascript
// screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AuthService from '../services/AuthService';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    gender: 'MALE',
  });
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const requestOtp = async () => {
    const { email, name, phone, gender } = formData;
    
    if (!email || !name || !phone) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.requestOtp(email, {
        name,
        phone,
        gender,
      });
      
      if (result.success) {
        setOtpSent(true);
        startCountdown();
        Alert.alert('Succès', 'Code OTP envoyé pour créer votre compte');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode) {
      Alert.alert('Erreur', 'Veuillez saisir le code OTP');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.verifyOtp(formData.email, otpCode);
      
      if (result.success) {
        Alert.alert('Succès', 'Compte créé avec succès !');
        navigation.replace('Main');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    try {
      const result = await AuthService.resendOtp(formData.email);
      
      if (result.success) {
        startCountdown();
        Alert.alert('Succès', 'Code OTP renvoyé');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!otpSent}
        />

        <TextInput
          style={styles.input}
          placeholder="Nom complet *"
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
          editable={!otpSent}
        />

        <TextInput
          style={styles.input}
          placeholder="Téléphone *"
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
          keyboardType="phone-pad"
          editable={!otpSent}
        />

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.gender}
            onValueChange={(value) => setFormData({...formData, gender: value})}
            enabled={!otpSent}
            style={styles.picker}
          >
            <Picker.Item label="Homme" value="MALE" />
            <Picker.Item label="Femme" value="FEMALE" />
          </Picker>
        </View>

        {!otpSent ? (
          <TouchableOpacity
            style={styles.button}
            onPress={requestOtp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Créer le compte</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Code OTP (6 chiffres)"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="numeric"
              maxLength={6}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={verifyOtp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Vérifier le code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resendButton, countdown > 0 && styles.disabledButton]}
              onPress={resendOtp}
              disabled={countdown > 0 || isLoading}
            >
              <Text style={styles.resendText}>
                {countdown > 0 
                  ? `Renvoyer dans ${countdown}s` 
                  : 'Renvoyer le code'
                }
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 40,
    color: '#007bff',
  },
  form: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    padding: 10,
    alignItems: 'center',
  },
  resendText: {
    color: '#007bff',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  linkButton: {
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#007bff',
    fontSize: 14,
  },
});

export default RegisterScreen;
```

## 🌐 Intégration Web (React)

### 1. Service d'Authentification

```javascript
// services/authService.js
class AuthService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
    this.appKey = 'instacar-secret-key-2024';
  }

  async requestOtp(email, userData = null) {
    const payload = { email };
    if (userData) {
      Object.assign(payload, userData);
    }

    const response = await fetch(`${this.baseUrl}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la demande OTP');
    }

    return data;
  }

  async verifyOtp(email, otpCode) {
    const response = await fetch(`${this.baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
      },
      body: JSON.stringify({ email, otpCode }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la vérification OTP');
    }

    // Stocker les tokens
    if (data.success) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  async resendOtp(email) {
    const response = await fetch(`${this.baseUrl}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors du renvoi OTP');
    }

    return data;
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error('Token d\'accès manquant');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    // Si le token a expiré, essayer de le renouveler
    if (response.status === 401) {
      const newToken = await this.refreshToken();
      if (newToken) {
        return fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'instakey': this.appKey,
            'Authorization': `Bearer ${newToken}`,
            ...options.headers,
          },
        });
      }
    }

    return response;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('Refresh token manquant');
    }

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'instakey': this.appKey,
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    }
    
    return null;
  }

  async logout() {
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'instakey': this.appKey,
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        console.error('Erreur logout:', error);
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export default new AuthService();
```

### 2. Composant de Connexion

```jsx
// components/LoginForm.jsx
import React, { useState } from 'react';
import authService from '../services/authService';

const LoginForm = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const requestOtp = async () => {
    if (!email) {
      setError('Veuillez saisir votre email');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const result = await authService.requestOtp(email);
      
      if (result.success) {
        setOtpSent(true);
        startCountdown();
        alert('Code OTP envoyé !');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode) {
      setError('Veuillez saisir le code OTP');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const result = await authService.verifyOtp(email, otpCode);
      
      if (result.success) {
        onLoginSuccess(result.user);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setError('');
    
    try {
      const result = await authService.resendOtp(email);
      
      if (result.success) {
        startCountdown();
        alert('Code OTP renvoyé !');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="login-form">
      <h2>Connexion InstaCar</h2>
      
      {error && <div className="error">{error}</div>}
      
      <div className="form-group">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={otpSent}
        />
      </div>

      {!otpSent ? (
        <button 
          onClick={requestOtp} 
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Envoi...' : 'Demander le code OTP'}
        </button>
      ) : (
        <>
          <div className="form-group">
            <input
              type="text"
              placeholder="Code OTP (6 chiffres)"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
            />
          </div>

          <button 
            onClick={verifyOtp} 
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Vérification...' : 'Vérifier le code'}
          </button>

          <button 
            onClick={resendOtp} 
            disabled={countdown > 0 || isLoading}
            className="btn btn-link"
          >
            {countdown > 0 
              ? `Renvoyer dans ${countdown}s` 
              : 'Renvoyer le code'
            }
          </button>
        </>
      )}
    </div>
  );
};

export default LoginForm;
```

## 🔒 Gestion des Erreurs

### Erreurs Courantes

```javascript
// Gestion des erreurs dans vos composants
const handleError = (error) => {
  switch (error.message) {
    case 'Utilisateur non trouvé':
      return 'Aucun compte trouvé avec cet email';
    case 'Code OTP invalide ou expiré':
      return 'Code OTP incorrect ou expiré. Veuillez demander un nouveau code.';
    case 'Veuillez attendre 1 minute avant de redemander un code':
      return 'Veuillez attendre 1 minute avant de redemander un code OTP';
    case 'Token d\'accès manquant':
      return 'Session expirée. Veuillez vous reconnecter.';
    case 'Clé d\'application manquante':
      return 'Erreur de configuration. Contactez le support.';
    default:
      return error.message || 'Une erreur est survenue';
  }
};
```

## 🧪 Tests d'Intégration

### Test Manuel

```bash
# 1. Tester la demande OTP
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -H "instakey: instacar-secret-key-2024" \
  -d '{"email": "test@example.com", "name": "Test User", "phone": "+33123456789", "gender": "MALE"}'

# 2. Vérifier le code OTP (utiliser le code reçu)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "instakey: instacar-secret-key-2024" \
  -d '{"email": "test@example.com", "otpCode": "123456"}'

# 3. Tester l'accès au profil
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "instakey: instacar-secret-key-2024" \
  -H "Authorization: Bearer <access_token>"
```

### Test Automatisé

```javascript
// tests/auth.test.js
import authService from '../services/authService';

describe('AuthService', () => {
  test('should request OTP successfully', async () => {
    const result = await authService.requestOtp('test@example.com', {
      name: 'Test User',
      phone: '+33123456789',
      gender: 'MALE'
    });
    
    expect(result.success).toBe(true);
    expect(result.isNewUser).toBe(true);
  });

  test('should verify OTP successfully', async () => {
    // D'abord demander un OTP
    const otpResult = await authService.requestOtp('test@example.com');
    
    // Puis vérifier avec le code reçu
    const result = await authService.verifyOtp('test@example.com', otpResult.otpCode);
    
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.accessToken).toBeDefined();
  });
});
```

## 🚀 Déploiement

### Configuration Production

```javascript
// config/production.js
export const config = {
  api: {
    baseUrl: 'https://api.instacar.com/api',
    appKey: process.env.REACT_APP_API_KEY,
  },
  email: {
    enabled: true,
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
};
```

### Variables d'Environnement

```env
# Production
REACT_APP_API_BASE_URL=https://api.instacar.com/api
REACT_APP_API_KEY=your-production-app-key

# Development
REACT_APP_API_BASE_URL=http://localhost:3000/api
REACT_APP_API_KEY=instacar-secret-key-2024
```

## 📱 Bonnes Pratiques

### Sécurité

1. **Ne jamais stocker** les tokens en clair
2. **Utiliser HTTPS** en production
3. **Valider** toutes les entrées utilisateur
4. **Gérer l'expiration** des tokens automatiquement
5. **Logger** les tentatives d'authentification

### UX

1. **Feedback visuel** pour les actions utilisateur
2. **Messages d'erreur** clairs et informatifs
3. **Compteur de temps** pour le renvoi OTP
4. **Validation en temps réel** des champs
5. **États de chargement** appropriés

### Performance

1. **Mise en cache** des tokens
2. **Renouvellement automatique** des tokens
3. **Gestion des erreurs réseau**
4. **Optimisation** des requêtes API

---

**🎉 Votre intégration est maintenant prête !**

Le système d'authentification par OTP est entièrement fonctionnel et sécurisé. Vous pouvez maintenant l'intégrer dans vos applications mobile et web. 