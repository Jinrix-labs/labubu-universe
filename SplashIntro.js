import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPLASH_SHOWN_KEY = '@splash_intro_shown';

export default function SplashIntro({ onComplete }) {
  const [showSkip, setShowSkip] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [hasVideoSource, setHasVideoSource] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start fully visible

  // Try to load video source - handle missing file gracefully
  let videoSource = null;
  try {
    videoSource = require('./assets/videos/splash-intro.mp4');
  } catch (error) {
    console.warn('Video file not found:', error);
  }

  const fadeOutAndComplete = useCallback(() => {
    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500, // 500ms fade out
      useNativeDriver: true,
    }).start(() => {
      // Call onComplete after fade completes
      onComplete();
    });
  }, [onComplete]);

  const handleVideoEnd = useCallback(async () => {
    // Mark splash as shown
    try {
      await AsyncStorage.setItem(SPLASH_SHOWN_KEY, 'true');
    } catch (error) {
      console.error('Error saving splash status:', error);
    }
    // Start fade out animation
    fadeOutAndComplete();
  }, [fadeOutAndComplete]);

  // Create video player with expo-video
  const player = useVideoPlayer(videoSource || null);


  const handleSkip = async () => {
    // Stop video and mark as shown
    try {
      if (player) {
        player.pause();
      }
      await AsyncStorage.setItem(SPLASH_SHOWN_KEY, 'true');
    } catch (error) {
      console.error('Error in handleSkip:', error);
    }
    // Start fade out animation
    fadeOutAndComplete();
  };

  const handleVideoError = (error) => {
    console.error('Video error:', error);
    setVideoError(true);
    // Auto-skip on error after a short delay with fade
    setTimeout(() => {
      fadeOutAndComplete();
    }, 1000);
  };

  // Set up video player
  useEffect(() => {
    if (!videoSource) {
      setHasVideoSource(false);
      const timer = setTimeout(() => {
        fadeOutAndComplete();
      }, 500);
      return () => clearTimeout(timer);
    }

    if (player && videoSource) {
      player.loop = false;
      player.play();

      // Listen for playback end
      const subscription = player.addListener('playToEnd', () => {
        handleVideoEnd();
      });

      return () => {
        subscription.remove();
      };
    }
  }, [player, videoSource, handleVideoEnd, fadeOutAndComplete]);

  useEffect(() => {
    // Show skip button after 2 seconds
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 2000);

    // Timeout fallback: if video doesn't load or finish within 10 seconds, auto-skip
    const timeoutTimer = setTimeout(() => {
      console.log('Splash screen timeout - auto-skipping');
      fadeOutAndComplete();
    }, 10000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(timeoutTimer);
    };
  }, [fadeOutAndComplete]);

  // If video error occurred or no video source, show fallback
  if (videoError || !hasVideoSource) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>Welcome to Labubu Universe</Text>
        </View>
        {showSkip && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip →</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        onError={handleVideoError}
      />
      
      {showSkip && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip →</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// Helper function to check if splash should show
export async function shouldShowSplash() {
  try {
    const hasShown = await AsyncStorage.getItem(SPLASH_SHOWN_KEY);
    return hasShown !== 'true';
  } catch (error) {
    return true; // Show on error to be safe
  }
}

// Helper to reset (for testing - remove in production)
export async function resetSplash() {
  await AsyncStorage.removeItem(SPLASH_SHOWN_KEY);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

