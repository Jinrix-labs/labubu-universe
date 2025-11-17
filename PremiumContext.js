import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';

// Temporarily disable Purchases import to avoid NativeEventEmitter error
// TODO: Re-enable after rebuilding native app with proper linking
let Purchases = null;
const ENABLE_PURCHASES = false; // Set to true after native rebuild

if (ENABLE_PURCHASES) {
  try {
    Purchases = require('react-native-purchases').default;
  } catch (error) {
    console.warn('react-native-purchases not available:', error.message);
  }
}

const PremiumContext = createContext(null);

export function usePremium() {
  return useContext(PremiumContext);
}

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only initialize if Purchases is available
    if (Purchases) {
      initializePurchases();
    } else {
      // If Purchases isn't available, just set loading to false
      // App will work in free mode
      setLoading(false);
      console.warn('RevenueCat not available - running in free mode');
    }
  }, []);

  const initializePurchases = async () => {
    if (!Purchases) {
      setLoading(false);
      return;
    }

    try {
      // Initialize RevenueCat
      if (Platform.OS === 'ios') {
        await Purchases.configure({ apiKey: 'app3222c59db5' });
      } else {
        // Add Android key later
        await Purchases.configure({ apiKey: 'ANDROID_KEY_HERE' });
      }

      // Check current premium status
      await checkPremiumStatus();
    } catch (error) {
      console.error('Error initializing purchases:', error);
      setLoading(false);
    }
  };

  const checkPremiumStatus = async () => {
    if (!Purchases) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Check if user has active "premium" entitlement
      const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
      setIsPremium(hasPremium);
      
      console.log('Premium status:', hasPremium);
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  const purchasePremium = async () => {
    if (!Purchases) {
      Alert.alert('Error', 'Purchases not available. Please restart the app.');
      return false;
    }

    try {
      setLoading(true);
      
      // Get available packages
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
        // Find the premium package (should be the one with lu_premium_unlock)
        const premiumPackage = offerings.current.availablePackages.find(
          pkg => pkg.product.identifier === 'lu_premium_unlock'
        );

        if (premiumPackage) {
          const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
          
          // Check if purchase was successful
          if (customerInfo.entitlements.active['premium']) {
            setIsPremium(true);
            Alert.alert(
              '🎉 Welcome to Premium!',
              'You now have unlimited access to all features!'
            );
            return true;
          }
        } else {
          Alert.alert('Error', 'Premium package not found. Please try again later.');
        }
      } else {
        Alert.alert('Error', 'No products available. Please try again later.');
      }
      
      return false;
    } catch (error) {
      if (error.userCancelled) {
        console.log('User cancelled purchase');
      } else {
        console.error('Purchase error:', error);
        Alert.alert('Purchase Failed', error.message || 'Please try again.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const restorePurchases = async () => {
    if (!Purchases) {
      Alert.alert('Error', 'Purchases not available. Please restart the app.');
      return;
    }

    try {
      setLoading(true);
      const customerInfo = await Purchases.restorePurchases();
      
      const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
      setIsPremium(hasPremium);
      
      if (hasPremium) {
        Alert.alert('✅ Restored!', 'Your premium access has been restored.');
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases for this account.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        loading,
        purchasePremium,
        restorePurchases,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

