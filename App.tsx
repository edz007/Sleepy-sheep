import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SleepProvider } from './src/contexts/SleepContext';
import { SheepProvider, useSheep } from './src/contexts/SheepContext';
import { NotificationService } from './src/services/notificationService';
import HomeScreen from './src/screens/HomeScreen';
import SleepModeScreen from './src/screens/SleepModeScreen';
import MorningSummaryScreen from './src/screens/MorningSummaryScreen';
import AlarmScreen from './src/screens/AlarmScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RelaxationModal from './src/screens/RelaxationModal';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PointsBreakdownScreen from './src/screens/PointsBreakdownScreen';
import ErrorBoundary from './src/components/ErrorBoundary';

const Stack = createStackNavigator();

// Wrapper component to connect SleepProvider with SheepProvider
const AppWithProviders: React.FC = () => {
  const { addPoints } = useSheep();
  
  return (
    <SleepProvider onPointsEarned={addPoints}>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#B8A4E4" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#B8A4E4',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'SleepySheep' }}
          />
          <Stack.Screen 
            name="SleepMode" 
            component={SleepModeScreen}
            options={{ 
              title: 'Sleep Mode',
              headerShown: false 
            }}
          />
          <Stack.Screen 
            name="MorningSummary" 
            component={MorningSummaryScreen}
            options={{ title: 'Good Morning!' }}
          />
          <Stack.Screen 
            name="Alarm" 
            component={AlarmScreen}
            options={{ 
              title: 'Wake Up!',
              headerShown: false 
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
          <Stack.Screen 
            name="Relaxation" 
            component={RelaxationModal}
            options={{ title: 'Can\'t Sleep?' }}
          />
          <Stack.Screen 
            name="PointsBreakdown" 
            component={PointsBreakdownScreen}
            options={{ title: 'Points Breakdown' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SleepProvider>
  );
};

// Wrapper for onboarding
const OnboardingWithProviders: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { addPoints } = useSheep();
  
  return (
    <SleepProvider onPointsEarned={addPoints}>
      <OnboardingScreen onComplete={onComplete} />
    </SleepProvider>
  );
};

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    // Request notification permissions on app start
    NotificationService.requestPermissions();
    NotificationService.setupNotificationCategories();
    
    // Check if user has completed onboarding
    // In a real app, you'd check AsyncStorage or user preferences
    // For demo purposes, we'll show onboarding
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <SheepProvider>
            <OnboardingWithProviders onComplete={handleOnboardingComplete} />
          </SheepProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SheepProvider>
          <AppWithProviders />
        </SheepProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
