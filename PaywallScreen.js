import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { usePremium } from './PremiumContext';

export default function PaywallScreen({ onClose }) {
  const { purchasePremium, restorePurchases, loading } = usePremium();

  const handlePurchase = async () => {
    const success = await purchasePremium();
    if (success) {
      onClose();
    }
  };

  const handleRestore = async () => {
    await restorePurchases();
  };

  return (
    <View style={paywallStyles.container}>
      <ScrollView contentContainerStyle={paywallStyles.content}>
        <Text style={paywallStyles.emoji}>✨</Text>
        <Text style={paywallStyles.title}>Unlock Premium</Text>
        <Text style={paywallStyles.subtitle}>
          You've reached the free limit of 15 Labubus!
        </Text>

        <View style={paywallStyles.featuresContainer}>
          <View style={paywallStyles.feature}>
            <Text style={paywallStyles.featureIcon}>🔓</Text>
            <Text style={paywallStyles.featureText}>Unlimited Collection</Text>
          </View>
          
          <View style={paywallStyles.feature}>
            <Text style={paywallStyles.featureIcon}>📸</Text>
            <Text style={paywallStyles.featureText}>Unlimited Photo Storage</Text>
          </View>
          
          <View style={paywallStyles.feature}>
            <Text style={paywallStyles.featureIcon}>📊</Text>
            <Text style={paywallStyles.featureText}>Full Analytics Access</Text>
          </View>
          
          <View style={paywallStyles.feature}>
            <Text style={paywallStyles.featureIcon}>🛍️</Text>
            <Text style={paywallStyles.featureText}>Store Links & Tracking</Text>
          </View>

          <View style={paywallStyles.feature}>
            <Text style={paywallStyles.featureIcon}>💖</Text>
            <Text style={paywallStyles.featureText}>Support Development</Text>
          </View>
        </View>

        <View style={paywallStyles.priceContainer}>
          <Text style={paywallStyles.price}>$7.99</Text>
          <Text style={paywallStyles.priceSubtitle}>One-time payment • Lifetime access</Text>
        </View>

        <TouchableOpacity
          style={paywallStyles.purchaseButton}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={paywallStyles.purchaseButtonText}>Unlock Premium</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={paywallStyles.restoreButton}
          onPress={handleRestore}
          disabled={loading}
        >
          <Text style={paywallStyles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={paywallStyles.closeButton}
          onPress={onClose}
        >
          <Text style={paywallStyles.closeButtonText}>Maybe Later</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const paywallStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B8B8B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    flex: 1,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFB3D9',
    marginBottom: 4,
  },
  priceSubtitle: {
    fontSize: 14,
    color: '#8B8B8B',
    fontWeight: '500',
  },
  purchaseButton: {
    backgroundColor: '#FFB3D9',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FFB3D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  restoreButton: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  restoreButtonText: {
    color: '#C9B8FF',
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 12,
  },
  closeButtonText: {
    color: '#8B8B8B',
    fontSize: 14,
    fontWeight: '500',
  },
});

