import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, FlatList, Alert, Modal, Pressable, Linking, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashIntro, { shouldShowSplash } from './SplashIntro';
import { PremiumProvider, usePremium } from './PremiumContext';
import PaywallScreen from './PaywallScreen';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

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

// Firestore Labubu loader
import { useLabubus } from './useLabubus';

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
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <LinearGradient colors={['#FFB3D9', '#C9B8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGrad}>
            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              style={{ paddingVertical: 14, alignItems: 'center' }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryGradText}>
                  {isLogin ? 'Login' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

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
function BrowseScreen({ user, onBack, onNavigate }) {
  const [selectedSeries, setSelectedSeries] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [userCollection, setUserCollection] = useState({ owned: [], wishlist: [], photos: {} });
  const [loading, setLoading] = useState(true);
  const { items: ALL_LABUBUS, seriesOptions: SERIES_OPTIONS_REMOTE, loading: catalogLoading } = useLabubus();
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const { isPremium } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);

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

  const awardBadge = async (badge) => {
    try {
      const refUser = doc(db, 'users', user.uid);
      const snap = await getDoc(refUser);
      const current = snap.exists() ? snap.data() : {};
      const badges = Array.from(new Set([...(current.badges || []), badge]));
      await setDoc(refUser, { ...current, badges }, { merge: true });
    } catch (e) {
      console.error('awardBadge error', e);
    }
  };

  const toggleOwned = async (labubuId) => {
    // Check if free user is at limit
    if (!isPremium && userCollection.owned.length >= 15 && !userCollection.owned.includes(labubuId)) {
      setShowPaywall(true);
      return;
    }

    const wasOwned = userCollection.owned.includes(labubuId);
    const newOwned = wasOwned
      ? userCollection.owned.filter(id => id !== labubuId)
      : [...userCollection.owned, labubuId];

    const newCollection = { ...userCollection, owned: newOwned };
    setUserCollection(newCollection);

    try {
      await setDoc(doc(db, 'users', user.uid), newCollection);

      if (!wasOwned) {
        // Haptics + confetti
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setConfettiKey(prev => prev + 1);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1500);

        if (newOwned.length >= 10) {
          await awardBadge('collector_10');
        }
        const labubu = ALL_LABUBUS.find(l => l.id === labubuId);
        if (labubu?.rarity?.toLowerCase() === 'secret') {
          await awardBadge('secret_finder');
        }
      }
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

  // Filter and sort Labubus (from Firestore)
  const filteredLabubus = ALL_LABUBUS
    .filter(labubu => {
      // Series filter
      const seriesMatch = selectedSeries === 'All' || labubu.series === selectedSeries;

      // Search filter
      const searchMatch = searchQuery === '' ||
        labubu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        labubu.series.toLowerCase().includes(searchQuery.toLowerCase()) ||
        labubu.color.toLowerCase().includes(searchQuery.toLowerCase());

      return seriesMatch && searchMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'series':
          return a.series.localeCompare(b.series);
        case 'value':
          return (b.estimatedValue?.max || 0) - (a.estimatedValue?.max || 0);
        case 'rarity':
          const rarityOrder = { 'Common': 1, 'Rare': 2, 'Limited': 3, 'Secret': 4, 'Ultra Rare': 5 };
          return (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
        case 'releaseDate':
          return new Date(b.releaseDate) - new Date(a.releaseDate);
        default:
          return 0;
      }
    });

  if (loading || catalogLoading) {
    return (
      <View style={styles.container}>
        <FlatList
          data={Array.from({ length: 6 })}
          keyExtractor={(_, i) => String(i)}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          renderItem={() => (
            <View style={styles.labubuCard}>
              <View style={[styles.labubuImage, { backgroundColor: '#f3f4f6' }]} />
              <View style={styles.labubuInfo}>
                <View style={[styles.skeletonLine, { width: '80%', marginBottom: 8 }]} />
                <View style={[styles.skeletonLine, { width: '60%', marginBottom: 6 }]} />
                <View style={[styles.skeletonLine, { width: '50%' }]} />
              </View>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFB3D9', '#C9B8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onBack();
        }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse All Labubus</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, series, or color..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Sort Options */}
      <View style={styles.sortWrapper}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContent}
        >
          {[
            { key: 'name', label: 'Name' },
            { key: 'series', label: 'Series' },
            { key: 'value', label: 'Value' },
            { key: 'rarity', label: 'Rarity' },
            { key: 'releaseDate', label: 'Newest' }
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortPill,
                sortBy === option.key && styles.sortPillActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSortBy(option.key);
              }}
            >
              <Text style={[
                styles.sortPillText,
                sortBy === option.key && styles.sortPillTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Series Filter Pills */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {SERIES_OPTIONS_REMOTE.map(series => (
            <TouchableOpacity
              key={series}
              style={[
                styles.filterPill,
                selectedSeries === series && styles.filterPillActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedSeries(series);
              }}
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

      {/* Results Counter */}
      <View style={styles.resultsWrapper}>
        <Text style={styles.resultsText}>
          {filteredLabubus.length} Labubu{filteredLabubus.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Labubu Grid */}
      {filteredLabubus.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No results found</Text>
          <TouchableOpacity style={styles.clearButton} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSearchQuery('');
            setSelectedSeries('All');
          }}>
            <Text style={styles.clearButtonText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredLabubus}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <View style={styles.labubuCard}>
              <Image source={{ uri: item.image }} style={styles.labubuImage} />
              <View style={styles.labubuInfo}>
                <Text style={styles.labubuName}>{item.name}</Text>
                <View style={styles.badgeContainer}>
                  {item.rarity ? (
                    <Text style={[styles.badge, styles[`rarity${item.rarity?.replace(' ', '')}`]]}>{item.rarity}</Text>
                  ) : null}
                  <Text style={[styles.badge, styles.seriesBadge]}>{item.series}</Text>
                </View>
                {item.estimatedValue && (
                  <Text style={styles.labubuValue}>
                    ${item.estimatedValue.min}-${item.estimatedValue.max}
                  </Text>
                )}
                <Text style={styles.labubuDate}>{item.releaseDate}</Text>
                <Text style={styles.labubuDimensions}>{item.dimensions}</Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    userCollection.owned.includes(item.id) && styles.actionButtonActive
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleOwned(item.id);
                  }}
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
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleWishlist(item.id);
                  }}
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
      )}
      {showConfetti && (
        <ConfettiCannon key={confettiKey} count={60} origin={{ x: 0, y: 0 }} fadeOut />
      )}
      {showPaywall && (
        <Modal visible={true} animationType="slide">
          <PaywallScreen onClose={() => setShowPaywall(false)} />
        </Modal>
      )}
      <TabBar currentScreen="browse" onNavigate={onNavigate} />
    </View>
  );
}

// Collection Screen
function CollectionScreen({ user, onBrowse, onBack, onNavigate }) {
  const [userCollection, setUserCollection] = useState({ owned: [], wishlist: [], photos: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('owned');
  const [uploadingId, setUploadingId] = useState(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [selectedLabubuId, setSelectedLabubuId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

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
    // Show modal with options: Take Photo or Choose from Library
    setSelectedLabubuId(labubuId);
    setShowPhotoOptions(true);
  };

  const handleTakePhoto = () => {
    if (selectedLabubuId) {
      takePhoto(selectedLabubuId);
    }
  };

  const handleChooseFromLibrary = () => {
    if (selectedLabubuId) {
      pickImage(selectedLabubuId);
    }
  };

  const takePhoto = async (labubuId) => {
    setShowPhotoOptions(false);
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
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadPhoto(labubuId, result.assets[0].uri);
    }
    // If result.canceled is true, the user tapped cancel - no action needed
  };

  const pickImage = async (labubuId) => {
    setShowPhotoOptions(false);

    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', status);

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photo library to add photos!');
        return;
      }

      console.log('Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Try without editing first
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadPhoto(labubuId, result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
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
      // Haptics + confetti
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfettiKey(prev => prev + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);

      // Badge: first photo
      const hadNoPhotosBefore = Object.keys(userCollection.photos || {}).length === 0;
      if (hadNoPhotosBefore) {
        try {
          const refUser = doc(db, 'users', user.uid);
          const snap = await getDoc(refUser);
          const current = snap.exists() ? snap.data() : {};
          const badges = Array.from(new Set([...(current.badges || []), 'photo_first']));
          await setDoc(refUser, { ...current, badges }, { merge: true });
        } catch (e) {
          console.error('awardBadge photo_first error', e);
        }
      }

      Alert.alert('Success!', 'Photo uploaded successfully! 🎉');
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Upload Failed', 'There was an error uploading your photo. Please try again.');
    } finally {
      setUploadingId(null);
    }
  };

  const { items: ALL_LABUBUS_COLLECTION, loading: catalogLoadingCollection } = useLabubus();
  const ownedLabubus = ALL_LABUBUS_COLLECTION.filter(l => userCollection.owned.includes(l.id));
  const wishlistLabubus = ALL_LABUBUS_COLLECTION.filter(l => userCollection.wishlist.includes(l.id));
  const currentLabubus = activeTab === 'owned' ? ownedLabubus : wishlistLabubus;

  if (loading || catalogLoadingCollection) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFB3D9', '#C9B8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onBack();
        }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Collection</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'owned' && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('owned');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'owned' && styles.tabTextActive]}>
            Owned ({ownedLabubus.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wishlist' && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('wishlist');
          }}
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
          <Text style={styles.emptySubtext}>
            Tap the + button to browse all Labubus
          </Text>
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
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleAddPhoto(item.id);
                  }}
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

      {/* Floating Action Button - ALWAYS VISIBLE */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onBrowse();
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FFB3D9', '#C9B8FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Photo Options Modal */}
      {showPhotoOptions && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPhotoOptions(false)}
        >
          <Pressable
            style={styles.photoModalOverlay}
            onPress={() => setShowPhotoOptions(false)}
          >
            <View style={styles.photoModalContent}>
              <Text style={styles.photoOptionsTitle}>Add Photo</Text>

              <TouchableOpacity
                style={styles.photoOptionButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleTakePhoto();
                }}
              >
                <Text style={styles.photoOptionText}>📷 Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoOptionButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleChooseFromLibrary();
                }}
              >
                <Text style={styles.photoOptionText}>🖼️ Choose from Library</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoOptionButton, styles.cancelButton]}
                onPress={() => setShowPhotoOptions(false)}
              >
                <Text style={styles.photoOptionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
      {showConfetti && (
        <ConfettiCannon key={confettiKey} count={60} origin={{ x: 0, y: 0 }} fadeOut />
      )}
      <TabBar currentScreen="collection" onNavigate={onNavigate} />
    </View>
  );
}

// Analytics Screen
function AnalyticsScreen({ user, onBack, onNavigate }) {
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

  const { items: ALL_LABUBUS_ANALYTICS, loading: catalogLoadingAnalytics } = useLabubus();

  // Calculate analytics
  const calculateAnalytics = () => {
    const ownedLabubus = ALL_LABUBUS_ANALYTICS.filter(l => userCollection.owned.includes(l.id));
    const wishlistLabubus = ALL_LABUBUS_ANALYTICS.filter(l => userCollection.wishlist.includes(l.id));

    // Basic stats
    const totalOwned = ownedLabubus.length;
    const totalWishlist = wishlistLabubus.length;
    const totalPhotos = Object.keys(userCollection.photos || {}).length;

    // Value calculations
    const ownedValue = ownedLabubus.reduce((sum, labubu) => {
      const avgValue = (labubu.estimatedValue?.min + labubu.estimatedValue?.max) / 2;
      return sum + (avgValue || 0);
    }, 0);

    const wishlistValue = wishlistLabubus.reduce((sum, labubu) => {
      const avgValue = (labubu.estimatedValue?.min + labubu.estimatedValue?.max) / 2;
      return sum + (avgValue || 0);
    }, 0);

    // Series breakdown
    const seriesStats = {};
    ownedLabubus.forEach(labubu => {
      if (!seriesStats[labubu.series]) {
        seriesStats[labubu.series] = { owned: 0, total: 0, value: 0 };
      }
      seriesStats[labubu.series].owned++;
      seriesStats[labubu.series].value += (labubu.estimatedValue?.min + labubu.estimatedValue?.max) / 2 || 0;
    });

    // Count total in each series
    ALL_LABUBUS_ANALYTICS.forEach(labubu => {
      if (!seriesStats[labubu.series]) {
        seriesStats[labubu.series] = { owned: 0, total: 0, value: 0 };
      }
      seriesStats[labubu.series].total++;
    });

    // Rarity breakdown
    const rarityStats = {};
    ownedLabubus.forEach(labubu => {
      rarityStats[labubu.rarity] = (rarityStats[labubu.rarity] || 0) + 1;
    });

    // Most valuable items
    const mostValuable = ownedLabubus
      .sort((a, b) => (b.estimatedValue?.max || 0) - (a.estimatedValue?.max || 0))
      .slice(0, 5);

    // Recent additions (by release date)
    const recentReleases = ownedLabubus
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
      .slice(0, 5);

    return {
      totalOwned,
      totalWishlist,
      totalPhotos,
      ownedValue,
      wishlistValue,
      seriesStats,
      rarityStats,
      mostValuable,
      recentReleases
    };
  };

  const analytics = calculateAnalytics();

  if (loading || catalogLoadingAnalytics) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFB3D9', '#C9B8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onBack();
        }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collection Analytics</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.analyticsScroll}>
        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.totalOwned}</Text>
            <Text style={styles.statLabel}>Owned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.totalWishlist}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.totalPhotos}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${analytics.ownedValue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Collection Value</Text>
          </View>
        </View>

        {/* Series Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Series Progress</Text>
          {Object.entries(analytics.seriesStats).map(([series, stats]) => (
            <View key={series} style={styles.seriesItem}>
              <View style={styles.seriesHeader}>
                <Text style={styles.seriesName}>{series}</Text>
                <Text style={styles.seriesProgress}>
                  {stats.owned}/{stats.total} ({Math.round((stats.owned / stats.total) * 100)}%)
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(stats.owned / stats.total) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.seriesValue}>Value: ${stats.value.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        {/* Rarity Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rarity Breakdown</Text>
          <View style={styles.rarityGrid}>
            {Object.entries(analytics.rarityStats).map(([rarity, count]) => (
              <View key={rarity} style={styles.rarityCard}>
                <Text style={[styles.rarityBadge, styles[`rarity${rarity.replace(' ', '')}`]]}>
                  {rarity}
                </Text>
                <Text style={styles.rarityCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Most Valuable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Valuable Items</Text>
          {analytics.mostValuable.map((labubu, index) => (
            <View key={labubu.id} style={styles.valueItem}>
              <Text style={styles.valueRank}>#{index + 1}</Text>
              <Image source={{ uri: labubu.image }} style={styles.valueImage} />
              <View style={styles.valueInfo}>
                <Text style={styles.valueName}>{labubu.name}</Text>
                <Text style={styles.valueSeries}>{labubu.series}</Text>
              </View>
              <Text style={styles.valueAmount}>
                ${labubu.estimatedValue?.min}-${labubu.estimatedValue?.max}
              </Text>
            </View>
          ))}
        </View>

        {/* Recent Additions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Additions</Text>
          {analytics.recentReleases.map((labubu, index) => (
            <View key={labubu.id} style={styles.recentItem}>
              <Image source={{ uri: labubu.image }} style={styles.recentImage} />
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{labubu.name}</Text>
                <Text style={styles.recentSeries}>{labubu.series}</Text>
                <Text style={styles.recentDate}>{labubu.releaseDate}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <TabBar currentScreen="analytics" onNavigate={onNavigate} />
    </View>
  );
}

// Profile Screen
function ProfileScreen({ user, onBack, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [userCollection, setUserCollection] = useState({ owned: [], wishlist: [], photos: {} });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showBadgeToast, setShowBadgeToast] = useState(false);
  const [badgeToastText, setBadgeToastText] = useState('');
  const [prevBadgeCount, setPrevBadgeCount] = useState(0);

  const { items: ALL_LABUBUS_PROFILE, loading: catalogLoadingProfile } = useLabubus();

  useEffect(() => {
    // Load initial data first, then set up real-time listener
    const loadInitialData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setUserCollection({
            owned: data.owned || [],
            wishlist: data.wishlist || [],
            photos: data.photos || {}
          });
        } else {
          setProfile({ displayName: user.email, badges: [] });
          setUserCollection({ owned: [], wishlist: [], photos: {} });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfile({ displayName: user.email, badges: [] });
        setUserCollection({ owned: [], wishlist: [], photos: {} });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Set up real-time listener for updates
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setUserCollection({
          owned: data.owned || [],
          wishlist: data.wishlist || [],
          photos: data.photos || {}
        });
      } else {
        setProfile({ displayName: user.email, badges: [] });
        setUserCollection({ owned: [], wishlist: [], photos: {} });
      }
    }, (error) => {
      console.error('Error in profile listener:', error);
    });

    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user.email || '');
      setBio(profile.bio || '');
      setAvatarPreview(profile.avatarUrl || null);
      const count = (profile.badges || []).length;
      if (count > prevBadgeCount) {
        const last = (profile.badges || [])[count - 1];
        setBadgeToastText(`New badge: ${last}`);
        setShowBadgeToast(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setShowBadgeToast(false), 2000);
      }
      setPrevBadgeCount(count);
    }
  }, [profile]);

  // Calculate stats from actual collection data
  const calculateStats = () => {
    // Convert IDs to strings for consistent comparison
    const ownedIds = (userCollection.owned || []).map(id => String(id));
    const wishlistIds = (userCollection.wishlist || []).map(id => String(id));

    const ownedLabubus = ALL_LABUBUS_PROFILE.filter(l => ownedIds.includes(String(l.id)));
    const totalOwned = ownedLabubus.length;
    const totalWishlist = wishlistIds.length;
    const totalPhotos = Object.keys(userCollection.photos || {}).length;

    // Calculate collection value
    const collectionValue = ownedLabubus.reduce((sum, labubu) => {
      const avgValue = labubu.estimatedValue
        ? (labubu.estimatedValue.min + labubu.estimatedValue.max) / 2
        : 0;
      return sum + avgValue;
    }, 0);

    return {
      owned: totalOwned,
      wishlist: totalWishlist,
      photos: totalPhotos,
      value: collectionValue
    };
  };

  const stats = calculateStats();

  if (loading || catalogLoadingProfile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photo library to set an avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatarPreview(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Avatar pick error', e);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      let avatarUrlToSave = profile?.avatarUrl || null;
      // If preview is a local file (picked now), upload it
      if (avatarPreview && !/^https?:\/\//.test(avatarPreview)) {
        const response = await fetch(avatarPreview);
        const blob = await response.blob();
        const avatarRef = ref(storage, `users/${user.uid}/avatar.jpg`);
        await uploadBytes(avatarRef, blob);
        avatarUrlToSave = await getDownloadURL(avatarRef);
      }
      const newProfile = {
        ...profile,
        displayName: displayName || user.email,
        bio: bio || '',
        avatarUrl: avatarUrlToSave,
      };
      await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
      setProfile(newProfile);
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      console.error('Save profile error', e);
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Show confirmation alert (Apple requires this)
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently delete all your data including your collection, photos, and profile. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const userId = user.uid;

              // 1. Delete user photos from Storage
              try {
                const photosRef = ref(storage, `users/${userId}/photos`);
                const photosList = await listAll(photosRef);
                await Promise.all(photosList.items.map(item => deleteObject(item)));

                // Delete avatar if exists
                const avatarRef = ref(storage, `users/${userId}/avatar.jpg`);
                try {
                  await deleteObject(avatarRef);
                } catch (e) {
                  // Avatar might not exist, ignore
                }
              } catch (e) {
                console.error('Error deleting photos:', e);
              }

              // 2. Delete user document from Firestore
              try {
                await deleteDoc(doc(db, 'users', userId));
              } catch (e) {
                console.error('Error deleting user document:', e);
              }

              // 3. Delete Firebase Auth user
              const currentUser = auth.currentUser;
              if (currentUser) {
                await deleteUser(currentUser);
              }

              // 4. Sign out (will navigate back to login automatically)
              await signOut(auth);

              Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(
                'Error',
                error.code === 'auth/requires-recent-login'
                  ? 'For security, please log out and log back in before deleting your account.'
                  : 'Failed to delete account. Please try again or contact support.'
              );
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };


  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFB3D9', '#C9B8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onBack();
        }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView style={styles.hubScroll}>
        {showBadgeToast && (
          <View style={{ position: 'absolute', top: 8, left: 16, right: 16, zIndex: 10 }}>
            <View style={{ backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{badgeToastText}</Text>
            </View>
          </View>
        )}
        <View style={styles.sectionBubble}>
          <View style={{ alignItems: 'center' }}>
            <Image
              source={{ uri: avatarPreview || 'https://via.placeholder.com/120/FFE8F0/FFFFFF?text=Labubu' }}
              style={{ width: 96, height: 96, borderRadius: 999, backgroundColor: '#FFF9F5' }}
            />
            {isEditing ? (
              <>
                <TouchableOpacity onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handlePickAvatar();
                }} style={[styles.uploadButton, { marginTop: 10 }]}>
                  <Text style={styles.uploadButtonText}>Change Avatar</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { marginTop: 12 }]}
                  placeholder="Display name"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
                <TextInput
                  style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                  placeholder="Bio"
                  multiline
                  value={bio}
                  onChangeText={setBio}
                />
                <LinearGradient colors={['#FFB3D9', '#C9B8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGrad}>
                  <TouchableOpacity onPress={handleSaveProfile} disabled={saving} style={{ paddingVertical: 12, alignItems: 'center' }}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryGradText}>Save Profile</Text>}
                  </TouchableOpacity>
                </LinearGradient>
                <TouchableOpacity onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsEditing(false);
                  setAvatarPreview(profile?.avatarUrl || null);
                }} style={[styles.clearButton, { marginTop: 10 }]}>
                  <Text style={styles.clearButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.cardTitle, { marginTop: 10 }]}>
                  {profile?.displayName || user.email}
                </Text>
                {profile?.bio ? (
                  <Text style={styles.cardSubtitle}>{profile.bio}</Text>
                ) : null}
                <TouchableOpacity onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsEditing(true);
                }} style={[styles.uploadButton, { marginTop: 12, backgroundColor: '#FFB3D9' }]}>
                  <Text style={styles.uploadButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.overviewGrid}>
            {[{ label: 'Owned', value: stats.owned || 0 }, { label: 'Wishlist', value: stats.wishlist || 0 }, { label: 'Photos', value: stats.photos || 0 }, { label: 'Value', value: `$${(stats.value || 0).toFixed(0)}` }].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statNumber}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionBubble}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(profile?.badges || []).map((b) => (
              <Text key={b} style={[styles.badge, styles.seriesBadge]}>{b}</Text>
            ))}
            {(profile?.badges || []).length === 0 && (
              <Text style={styles.cardSubtitle}>No badges yet</Text>
            )}
          </View>
        </View>

        {/* Delete Account Section */}
        <View style={styles.sectionBubble}>
          <Text style={[styles.sectionTitle, { color: '#ef4444', marginBottom: 12 }]}>Danger Zone</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleDeleteAccount();
            }}
            disabled={saving}
            style={{
              backgroundColor: '#ef4444',
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 12,
              alignItems: 'center',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                Delete Account
              </Text>
            )}
          </TouchableOpacity>
          <Text style={[styles.cardSubtitle, { marginTop: 8, fontSize: 12, textAlign: 'center' }]}>
            Permanently delete your account and all data
          </Text>
        </View>
      </ScrollView>

      <TabBar currentScreen="profile" onNavigate={onNavigate} />
    </View>
  );
}

// Store Screen
function StoreScreen({ onBack, onNavigate }) {
  const { items, loading } = useLabubus();
  const [queryText, setQueryText] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Show all items, not just those with store links
  const filtered = React.useMemo(() => {
    const q = queryText.trim().toLowerCase();
    let list = q
      ? items.filter(i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.series || '').toLowerCase().includes(q) ||
        [i.series, i.rarity].filter(Boolean).some(t => (t || '').toLowerCase().includes(q))
      )
      : items;

    switch (sortBy) {
      case 'price': return [...list].sort((a, b) => (a.originalPrice ?? 0) - (b.originalPrice ?? 0));
      case 'series': return [...list].sort((a, b) => (a.series || '').localeCompare(b.series || ''));
      default: return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
  }, [items, queryText, sortBy]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFB3D9', '#C9B8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onBack();
        }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search store…"
          value={queryText}
          onChangeText={setQueryText}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.sortWrapper}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortContent}>
          {[
            { key: 'name', label: 'Name' },
            { key: 'price', label: 'Price' },
            { key: 'series', label: 'Series' },
          ].map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortPill, sortBy === opt.key && styles.sortPillActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSortBy(opt.key);
              }}
            >
              <Text style={[styles.sortPillText, sortBy === opt.key && styles.sortPillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <FlatList
          data={Array.from({ length: 6 })}
          keyExtractor={(_, i) => String(i)}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          renderItem={() => (
            <View style={styles.labubuCard}>
              <View style={[styles.labubuImage, { backgroundColor: '#f3f4f6' }]} />
              <View style={styles.labubuInfo}>
                <View style={[styles.skeletonLine, { width: '80%', marginBottom: 8 }]} />
                <View style={[styles.skeletonLine, { width: '60%', marginBottom: 6 }]} />
                <View style={[styles.skeletonLine, { width: '50%' }]} />
              </View>
              <View style={styles.buttonRow}>
                <View style={[styles.actionButton, { backgroundColor: '#e5e7eb' }]} />
              </View>
            </View>
          )}
        />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {queryText ? 'No items match your search.' : 'No items available in store.'}
          </Text>
          {queryText && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setQueryText('')}
            >
              <Text style={styles.clearButtonText}>Clear search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id || item.docId)}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <View style={styles.labubuCard}>
              <Image source={{ uri: item.image || '' }} style={styles.labubuImage} />
              <View style={styles.labubuInfo}>
                <Text style={styles.labubuName}>{item.name}</Text>
                <View style={styles.badgeContainer}>
                  {item.rarity && (
                    <Text style={[styles.badge, styles[`rarity${item.rarity?.replace(' ', '')}`]]}>
                      {item.rarity}
                    </Text>
                  )}
                  <Text style={[styles.badge, styles.seriesBadge]}>
                    {item.series}
                  </Text>
                </View>
                {item.originalPrice != null && (
                  <Text style={styles.labubuValue}>${Number(item.originalPrice).toFixed(2)}</Text>
                )}
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.buyButton]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Check multiple possible store link formats
                    const storeUrl = item.storeLinks?.popmart || item.storeLink || item.store_link;
                    if (storeUrl) {
                      Linking.openURL(storeUrl);
                    }
                  }}
                  disabled={!item.storeLinks?.popmart && !item.storeLink && !item.store_link}
                >
                  <Text style={[styles.actionButtonText, styles.buyButtonText]}>🛒 Buy</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <TabBar currentScreen="store" onNavigate={onNavigate} />
    </View>
  );
}

// Photo Studio Screen
function PhotoStudioScreen({ user, onBack, onNavigate }) {
  const [userCollection, setUserCollection] = useState({ owned: [], wishlist: [], photos: {} });
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const { items: ALL_LABUBUS_PHOTO, loading: catalogLoadingPhoto } = useLabubus();

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

  const handleDeletePhoto = async (labubuId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const newPhotos = { ...userCollection.photos };
            delete newPhotos[labubuId];
            const newCollection = { ...userCollection, photos: newPhotos };
            setUserCollection(newCollection);

            try {
              await setDoc(doc(db, 'users', user.uid), newCollection);
              setSelectedPhoto(null);
              Alert.alert('Success', 'Photo deleted!');
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  // Get all photos with their Labubu info
  const photoGallery = Object.entries(userCollection.photos || {}).map(([labubuId, photoUrl]) => {
    const labubu = ALL_LABUBUS_PHOTO.find(l => String(l.id) === String(labubuId));
    return {
      labubuId,
      photoUrl,
      labubuName: labubu?.name || 'Unknown Labubu',
      series: labubu?.series || '',
    };
  });

  if (loading || catalogLoadingPhoto) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFB3D9', '#C9B8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onBack();
        }}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Studio</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      {photoGallery.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No photos yet!</Text>
          <Text style={styles.emptySubtext}>Add photos to your owned Labubus in the Collection</Text>
        </View>
      ) : (
        <>
          <Text style={styles.galleryCount}>{photoGallery.length} Photo{photoGallery.length !== 1 ? 's' : ''}</Text>
          <FlatList
            data={photoGallery}
            keyExtractor={item => item.labubuId}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.photoCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPhoto(item);
                }}
              >
                <Image source={{ uri: item.photoUrl }} style={styles.photoImage} />
                <View style={styles.photoInfo}>
                  <Text style={styles.photoName}>{item.labubuName}</Text>
                  <Text style={styles.photoSeries}>{item.series}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* Full Screen Photo Modal */}
      {selectedPhoto && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedPhoto(null);
            }}
          >
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedPhoto.photoUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              <View style={styles.modalInfo}>
                <Text style={styles.modalTitle}>{selectedPhoto.labubuName}</Text>
                <Text style={styles.modalSeries}>{selectedPhoto.series}</Text>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleDeletePhoto(selectedPhoto.labubuId);
                  }}
                >
                  <Text style={styles.modalButtonText}>Delete Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.closeButton]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPhoto(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
      <TabBar currentScreen="photoStudio" onNavigate={onNavigate} />
    </View>
  );
}

// Main Hub Screen
function MainHub({ user, onLogout }) {
  const [currentScreen, setCurrentScreen] = useState('hub');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setProfile(snap.data());
    });
    return unsub;
  }, [user]);

  if (currentScreen === 'collection') {
    return (
      <CollectionScreen
        user={user}
        onBrowse={() => setCurrentScreen('browse')}
        onBack={() => setCurrentScreen('hub')}
        onNavigate={(route) => setCurrentScreen(route)}
      />
    );
  }

  if (currentScreen === 'browse') {
    return (
      <BrowseScreen
        user={user}
        onBack={() => setCurrentScreen('collection')}
        onNavigate={(route) => setCurrentScreen(route)}
      />
    );
  }

  if (currentScreen === 'store') {
    return (
      <StoreScreen
        onBack={() => setCurrentScreen('hub')}
        onNavigate={(route) => setCurrentScreen(route)}
      />
    );
  }

  if (currentScreen === 'photoStudio') {
    return (
      <PhotoStudioScreen
        user={user}
        onBack={() => setCurrentScreen('hub')}
        onNavigate={(route) => setCurrentScreen(route)}
      />
    );
  }

  if (currentScreen === 'analytics') {
    return (
      <AnalyticsScreen
        user={user}
        onBack={() => setCurrentScreen('hub')}
        onNavigate={(route) => setCurrentScreen(route)}
      />
    );
  }

  if (currentScreen === 'profile') {
    return (
      <ProfileScreen
        user={user}
        onBack={() => setCurrentScreen('hub')}
        onNavigate={(route) => setCurrentScreen(route)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFB3D9', '#C9B8FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Labubu Universe</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.hubScroll}>
        <Text style={styles.welcomeText}>Welcome, {profile?.displayName || user.email}!</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('profile');
          }}
        >
          <Text style={styles.cardTitle}>👤 Profile</Text>
          <Text style={styles.cardSubtitle}>Your stats and badges</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('collection');
          }}
        >
          <Text style={styles.cardTitle}>✨ My Labubu Family</Text>
          <Text style={styles.cardSubtitle}>View and manage your Labubus</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('store');
          }}
        >
          <Text style={styles.cardTitle}>🛍️ Get More Labubus!</Text>
          <Text style={styles.cardSubtitle}>Browse and buy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('photoStudio');
          }}
        >
          <Text style={styles.cardTitle}>📷 Memory Gallery</Text>
          <Text style={styles.cardSubtitle}>View all your Labubu photos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('analytics');
          }}
        >
          <Text style={styles.cardTitle}>✨ Collection Journey</Text>
          <Text style={styles.cardSubtitle}>Collection stats and insights</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎀 Community</Text>
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
  const [showSplash, setShowSplash] = useState(true);
  const [checkingSplash, setCheckingSplash] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    checkSplashStatus();
  }, []);

  const checkSplashStatus = async () => {
    const shouldShow = await shouldShowSplash();
    setShowSplash(shouldShow);
    setCheckingSplash(false);
  };

  useEffect(() => {
    if (!checkingSplash && !showSplash) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return unsubscribe;
    }
  }, [checkingSplash, showSplash]);

  useEffect(() => {
    if (!showSplash && !loading) {
      // Fade in the main content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSplash, loading]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Show splash on first launch
  if (checkingSplash) {
    return null; // Or a simple loading indicator
  }

  if (showSplash) {
    return (
      <SplashIntro
        onComplete={() => {
          setShowSplash(false);
        }}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <PremiumProvider>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {user ? (
          <MainHub user={user} onLogout={handleLogout} />
        ) : (
          <AuthScreen />
        )}
      </Animated.View>
    </PremiumProvider>
  );
}

// Bottom Tab Bar
function TabBar({ currentScreen, onNavigate }) {
  const tabs = [
    { key: 'collection', label: '📦', title: 'Collection' },
    { key: 'store', label: '🏪', title: 'Store' },
    { key: 'photoStudio', label: '📸', title: 'Studio' },
    { key: 'analytics', label: '📊', title: 'Stats' },
    { key: 'profile', label: '👤', title: 'Profile' },
  ];
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 12, paddingTop: 8, backgroundColor: '#FFF5F8', borderTopWidth: 1, borderTopColor: '#FFE8F0' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {tabs.map(t => {
          const active = currentScreen === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNavigate && onNavigate(t.key);
              }}
              style={{ alignItems: 'center', padding: 6, minWidth: 60 }}
            >
              <Text style={{ fontSize: 18 }}>{t.label}</Text>
              <Text style={{ fontSize: 10, marginTop: 2, color: active ? '#FF6B9D' : '#8B8B8B', fontWeight: active ? '700' : '600' }}>{t.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
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
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#FFB3D9',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    backgroundColor: '#FFF5F8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
    fontSize: 16,
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
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.3,
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
    backgroundColor: '#FFF5F8',
    padding: 24,
    borderRadius: 22,
    marginBottom: 16,
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FFE8F0',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  sectionBubble: {
    backgroundColor: '#FFF5F8',
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFE8F0',
  },
  searchWrapper: {
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    backgroundColor: '#FFF9F5',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 26,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#FFE8F0',
  },
  sortWrapper: {
    backgroundColor: '#FFF5F8',
    paddingVertical: 12,
    paddingLeft: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 10,
  },
  sortContent: {
    paddingRight: 15,
  },
  sortPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: '#FFF5F8',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FFE8F0',
  },
  sortPillActive: {
    backgroundColor: '#6366f1',
  },
  sortPillText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sortPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterWrapper: {
    backgroundColor: '#FFF5F8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
  },
  resultsWrapper: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterContent: {
    paddingHorizontal: 15,
  },
  filterPill: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#FFF5F8',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFE8F0',
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
    paddingBottom: 100, // Extra padding to prevent last items from being cut off by TabBar
  },
  labubuCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: '48%',
    borderWidth: 1.5,
    borderColor: '#FFE8F0',
  },
  labubuInfo: {
    padding: 12,
  },
  labubuImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFF9F5',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
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
  labubuMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labubuRarity: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  rarityCommon: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
  rarityRare: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  rarityLimited: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  raritySecret: {
    backgroundColor: '#fce7f3',
    color: '#be185d',
  },
  rarityUltraRare: {
    backgroundColor: '#f3e8ff',
    color: '#7c3aed',
  },
  labubuValue: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FFF5F8',
    marginHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE8F0',
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
    backgroundColor: '#FFF5F8',
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
    backgroundColor: '#FFB3D9',
    padding: 10,
    borderRadius: 14,
    marginTop: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF9BC8',
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
  galleryCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    padding: 15,
    paddingBottom: 5,
  },
  photoCard: {
    flex: 1,
    margin: 5,
    backgroundColor: '#FFF5F8',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: '48%',
  },
  photoImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f5f5f5',
  },
  photoInfo: {
    padding: 12,
  },
  photoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  photoSeries: {
    fontSize: 12,
    color: '#6366f1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenImage: {
    width: '100%',
    height: '70%',
  },
  modalInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  modalSeries: {
    fontSize: 16,
    color: '#a5b4fc',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  closeButton: {
    backgroundColor: '#6366f1',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 20,
  },
  analyticsScroll: {
    flex: 1,
    padding: 15,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFF5F8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '48%',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFF5F8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  seriesItem: {
    marginBottom: 15,
  },
  seriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seriesName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  seriesProgress: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  seriesValue: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  rarityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rarityCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  rarityBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  rarityCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  valueRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
    width: 30,
  },
  valueImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  valueInfo: {
    flex: 1,
  },
  valueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  valueSeries: {
    fontSize: 12,
    color: '#666',
  },
  valueAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  recentSeries: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 11,
    color: '#999',
  },
  // Photo Options Modal Styles
  photoOptionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoOptionsModal: {
    backgroundColor: '#FFF5F8',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  photoOptionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  photoOptionsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  photoOptionButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  photoOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoOptionCancel: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  photoOptionCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  // Store Screen Styles
  skeletonLine: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 6,
  },
  badge: {
    fontSize: 9,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 4,
    marginBottom: 4,
  },
  seriesBadge: {
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
  },
  buyButton: {
    backgroundColor: '#111827',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 32,
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoModalContent: {
    backgroundColor: '#FFF5F8',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    marginTop: 8,
  },
});