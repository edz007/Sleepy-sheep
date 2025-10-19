import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated
} from 'react-native';
import { useSleep } from '../contexts/SleepContext';

const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, loading, refreshSettings } = useSleep();
  const [bedtimeTarget, setBedtimeTarget] = useState('22:00');
  const [wakeTimeTarget, setWakeTimeTarget] = useState('07:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [checkInInterval, setCheckInInterval] = useState(30);
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Animation values
  const toastAnimation = useRef(new Animated.Value(0)).current;
  const checkmarkAnimation = useRef(new Animated.Value(0)).current;

  // Refresh settings when component mounts
  useEffect(() => {
    refreshSettings();
  }, []);

  // Update local state when settings are loaded
  useEffect(() => {
    console.log('Settings changed in SettingsScreen:', settings);
    if (settings) {
      console.log('Updating local state with:', {
        bedtime_target: settings.bedtime_target,
        wake_time_target: settings.wake_time_target,
        notification_enabled: settings.notification_enabled,
        check_in_interval: settings.check_in_interval,
      });
      setBedtimeTarget(settings.bedtime_target || '22:00');
      setWakeTimeTarget(settings.wake_time_target || '07:00');
      setNotificationsEnabled(settings.notification_enabled || true);
      setCheckInInterval(settings.check_in_interval || 30);
    }
  }, [settings]);

  // Show success toast animation
  const showSuccessAnimation = () => {
    setShowSuccessToast(true);
    
    // Animate toast sliding in
    Animated.sequence([
      Animated.timing(toastAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(checkmarkAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessToast(false);
      checkmarkAnimation.setValue(0);
    });
  };

  const handleSaveSettings = async () => {
    if (saving) return; // Prevent multiple saves
    
    setSaving(true);
    
    try {
      console.log('Saving settings:', {
        bedtime_target: bedtimeTarget,
        wake_time_target: wakeTimeTarget,
        notification_enabled: notificationsEnabled,
        check_in_interval: checkInInterval,
      });

      // Validate time inputs
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (!timeRegex.test(bedtimeTarget)) {
        Alert.alert('Invalid Bedtime', 'Please enter bedtime in HH:MM format (e.g., 22:00)');
        setSaving(false);
        return;
      }
      
      if (!timeRegex.test(wakeTimeTarget)) {
        Alert.alert('Invalid Wake Time', 'Please enter wake time in HH:MM format (e.g., 07:00)');
        setSaving(false);
        return;
      }
      
      if (checkInInterval < 1 || checkInInterval > 60) {
        Alert.alert('Invalid Interval', 'Check-in interval must be between 1 and 60 minutes');
        setSaving(false);
        return;
      }

      await updateSettings({
        bedtime_target: bedtimeTarget,
        wake_time_target: wakeTimeTarget,
        notification_enabled: notificationsEnabled,
        check_in_interval: checkInInterval,
      });
      
      // Show success animation instead of alert
      showSuccessAnimation();
    } catch (error) {
      console.error('Save settings error:', error);
      Alert.alert('Error', `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        {/* Bedtime Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep Schedule</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Bedtime Target</Text>
            <TextInput
              style={styles.timeInput}
              value={bedtimeTarget}
              onChangeText={setBedtimeTarget}
              placeholder="22:00"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Wake Time Target</Text>
            <TextInput
              style={styles.timeInput}
              value={wakeTimeTarget}
              onChangeText={setWakeTimeTarget}
              placeholder="07:00"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#9B7EDE' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Check-in Interval (minutes)</Text>
            <TextInput
              style={styles.numberInput}
              value={checkInInterval.toString()}
              onChangeText={(text) => setCheckInInterval(parseInt(text) || 30)}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSaveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Toast */}
      {showSuccessToast && (
        <Animated.View 
          style={[
            styles.successToast,
            {
              transform: [
                {
                  translateY: toastAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
              opacity: toastAnimation,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.checkmarkContainer,
              {
                transform: [
                  {
                    scale: checkmarkAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.checkmark}>✓</Text>
          </Animated.View>
          <Text style={styles.successText}>Settings Updated!</Text>
          <Text style={styles.successSubtext}>Your preferences have been saved</Text>
        </Animated.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B8A4E4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B8A4E4',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  timeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  numberInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 16,
    width: 60,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#9B7EDE',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(155, 126, 222, 0.6)',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successToast: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkmarkContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  checkmark: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  successText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  successSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2,
  },
});

export default SettingsScreen;