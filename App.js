import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, FlatList, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// FIREBASE CONFIG - Your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAgEdyqSoIEJxhV1ywCsl50OvVl7XvURGI",
  authDomain: "labubu-app-f42ca.firebaseapp.com",
  projectId: "labubu-app-f42ca",
  storageBucket: "labubu-app-f42ca.firebasestorage.app",
  messagingSenderId: "9943020327",
  appId: "1:9943020327:web:753af08ec118f512d3ef02",
  measurementId: "G-6PVLB0C865"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db = getFirestore(app);
export const storage = getStorage(app);

// Import real Labubu dataset
import { LABUBU_DATA, SERIES_OPTIONS } from './labubuData';

// Auth Screen Component
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.authContainer}>
          <Text style={styles.title}>Labubu Tracker</Text>
          <Text style={styles.subtitle}>{isLogin ? 'Welcome Back!' : 'Create Account'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Login' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Browse All Labubus Screen
function BrowseScreen({ user, onBack }) {
  const [selectedSeries, setSelectedSeries] = useState('All');
  const [userCollection, setUserCollection] = useState({ owned: [], wishlist: [], photos: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserCollection();
  }, []);

  const loadUserCollection = async () => {
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserCollection(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOwned = async (labubuId) => {
    const newOwned = userCollection.owned.includes(labubuId)
      ? userCollection.owned.filter(id => id !== labubuId)
      : [...userCollection.owned, labubuId];

    const newCollection = { ...userCollection, owned: newOwned };
    setUserCollection(newCollection);

    try {
      await setDoc(doc(db, 'users', user.uid), newCollection);
    } catch (error) {
      console.error('Error updating owned:', error);
    }
  };

  const toggleWishlist = async (labubuId) => {
    const newWishlist = userCollection.wishlist.includes(labubuId)
      ? userCollection.wishlist.filter(id => id !== labubuId)
      : [...userCollection.wishlist, labubuId];

    const newCollection = { ...userCollection, wishlist: newWishlist };
    setUserCollection(newCollection);

    try {
      await setDoc(doc(db, 'users', user.uid), newCollection);
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  const filteredLabubus = selectedSeries === 'All'
    ? LABUBU_DATA
    : LABUBU_DATA.filter(l => l.series === selectedSeries);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse All Labubus</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Series Filter Pills */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {SERIES_OPTIONS.map(series => (
            <TouchableOpacity
              key={series}
              style={[
                styles.filterPill,
                selectedSeries === series && styles.filterPillActive
              ]}
              onPress={() => setSelectedSeries(series)}
            >
              <Text style={[
                styles.filterPillText,
                selectedSeries === series && styles.filterPillTextActive
              ]}>
                {series}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Labubu Grid */}
      <FlatList
        data={filteredLabubus}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <View style={styles.labubuCard}>
            <Image source={{ uri: item.image }} style={styles.labubuImage} />
            <Text style={styles.labubuName}>{item.name}</Text>
            <Text style={styles.labubuSeries}>{item.series}</Text>
            <Text style={styles.labubuDate}>{item.releaseDate}</Text>
            <Text style={styles.labubuDimensions}>{item.dimensions}</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  userCollection.owned.includes(item.id) && styles.actionButtonActive
                ]}
                onPress={() => toggleOwned(item.id)}
              >
                <Text style={[
                  styles.actionButtonText,
                  userCollection.owned.includes(item.id) && styles.actionButtonTextActive
                ]}>
                  {userCollection.owned.includes(item.id) ? '✓ Owned' : 'Own'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  userCollection.wishlist.includes(item.id) && styles.actionButtonActive
                ]}
                onPress={() => toggleWishlist(item.id)}
              >
                <Text style={[
                  styles.actionButtonText,
                  userCollection.wishlist.includes(item.id) && styles.actionButtonTextActive
                ]}>
                  {userCollection.wishlist.includes(item.id) ? '♥ Wish' : 'Wishlist'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

// Collection Screen
function CollectionScreen({ user, onBrowse }) {
  const [userCollection, setUserCollection] = useState({ owned: [], wishlist: [], photos: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('owned');
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    loadUserCollection();
  }, []);

  const loadUserCollection = async () => {
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserCollection(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async (labubuId) => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to add photos!');
      return;
    }

    // Show options: Take Photo or Choose from Library
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(labubuId),
        },
        {
          text: 'Choose from Library',
          onPress: () => pickImage(labubuId),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const takePhoto = async (labubuId) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take photos!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadPhoto(labubuId, result.assets[0].uri);
    }
  };

  const pickImage = async (labubuId) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadPhoto(labubuId, result.assets[0].uri);
    }
  };

  const uploadPhoto = async (labubuId, uri) => {
    setUploadingId(labubuId);

    try {
      // Convert URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create storage reference
      const filename = `${Date.now()}.jpg`;
      const storageRef = ref(storage, `users/${user.uid}/labubus/${labubuId}/${filename}`);

      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firestore with photo URL
      const newPhotos = { ...userCollection.photos, [labubuId]: downloadURL };
      const newCollection = { ...userCollection, photos: newPhotos };
      setUserCollection(newCollection);

      await setDoc(doc(db, 'users', user.uid), newCollection);

      Alert.alert('Success!', 'Photo uploaded successfully! 🎉');
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Upload Failed', 'There was an error uploading your photo. Please try again.');
    } finally {
      setUploadingId(null);
    }
  };

  const ownedLabubus = LABUBU_DATA.filter(l => userCollection.owned.includes(l.id));
  const wishlistLabubus = LABUBU_DATA.filter(l => userCollection.wishlist.includes(l.id));
  const currentLabubus = activeTab === 'owned' ? ownedLabubus : wishlistLabubus;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Collection</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'owned' && styles.tabActive]}
          onPress={() => setActiveTab('owned')}
        >
          <Text style={[styles.tabText, activeTab === 'owned' && styles.tabTextActive]}>
            Owned ({ownedLabubus.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wishlist' && styles.tabActive]}
          onPress={() => setActiveTab('wishlist')}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.tabTextActive]}>
            Wishlist ({wishlistLabubus.length})
          </Text>
        </TouchableOpacity>
      </View>

      {currentLabubus.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {activeTab === 'owned'
              ? 'No Labubus in your collection yet!'
              : 'Your wishlist is empty!'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={onBrowse}>
            <Text style={styles.buttonText}>Browse All Labubus</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={currentLabubus}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <View style={styles.labubuCard}>
              <Image
                source={{ uri: userCollection.photos?.[item.id] || item.image }}
                style={styles.labubuImage}
              />
              {userCollection.photos?.[item.id] && (
                <Text style={styles.customPhotoLabel}>✓ Custom Photo</Text>
              )}
              <Text style={styles.labubuName}>{item.name}</Text>
              <Text style={styles.labubuSeries}>{item.series}</Text>
              <Text style={styles.labubuDate}>{item.releaseDate}</Text>
              {activeTab === 'owned' && (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleAddPhoto(item.id)}
                  disabled={uploadingId === item.id}
                >
                  {uploadingId === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.uploadButtonText}>
                      {userCollection.photos?.[item.id] ? '📸 Change Photo' : '📸 Add Photo'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

// Main Hub Screen
function MainHub({ user, onLogout }) {
  const [currentScreen, setCurrentScreen] = useState('hub');

  if (currentScreen === 'collection') {
    return (
      <CollectionScreen
        user={user}
        onBrowse={() => setCurrentScreen('browse')}
      />
    );
  }

  if (currentScreen === 'browse') {
    return (
      <BrowseScreen
        user={user}
        onBack={() => setCurrentScreen('collection')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Labubu Universe</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.hubScroll}>
        <Text style={styles.welcomeText}>Welcome, {user.email}!</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setCurrentScreen('collection')}
        >
          <Text style={styles.cardTitle}>📦 Collection</Text>
          <Text style={styles.cardSubtitle}>View and manage your Labubus</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏪 Store</Text>
          <Text style={styles.cardSubtitle}>Coming later</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📸 Photo Studio</Text>
          <Text style={styles.cardSubtitle}>Coming in Phase 4</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 Community Hub</Text>
          <Text style={styles.cardSubtitle}>Coming later</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return user ? (
    <MainHub user={user} onLogout={handleLogout} />
  ) : (
    <AuthScreen />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  authContainer: {
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6366f1',
    fontSize: 14,
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    fontSize: 16,
    color: '#6366f1',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#6366f1',
    fontSize: 14,
  },
  hubScroll: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  filterWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 15,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  filterPillActive: {
    backgroundColor: '#6366f1',
  },
  filterPillText: {
    fontSize: 14,
    color: '#666',
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  gridContent: {
    padding: 10,
  },
  labubuCard: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: '48%',
  },
  labubuImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  labubuName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  labubuSeries: {
    fontSize: 12,
    color: '#6366f1',
    marginBottom: 3,
  },
  labubuDate: {
    fontSize: 11,
    color: '#999',
    marginBottom: 3,
  },
  labubuDimensions: {
    fontSize: 10,
    color: '#999',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 2,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#6366f1',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#10b981',
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  customPhotoLabel: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 5,
  },
});