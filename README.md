# SleepySheep - Sleep Companion App

A gamified sleep tracking app featuring an adorable sheep companion that helps users build consistent sleep habits through emotional engagement and positive reinforcement.

## Features

- 🐑 **Animated Sheep Companion**: Cute sheep character that evolves based on your sleep habits
- 🌙 **Sleep Tracking**: Timer-based check-ins to monitor phone usage during sleep
- 🎯 **Points System**: Earn points for good sleep habits, lose points for phone usage
- 🔔 **Smart Notifications**: Bedtime reminders and gentle wake-up alarms
- 🧘 **Relaxation Tools**: Breathing exercises, calming music, and guided visualizations
- 🏆 **Evolution System**: Sheep grows and unlocks accessories as you improve
- 📊 **Sleep Analytics**: Detailed morning summaries with points breakdown
- 🎨 **Beautiful UI**: Soft pastel colors and smooth animations

## Tech Stack

- **Frontend**: React Native (Expo) with TypeScript
- **Backend**: Supabase (Database, Auth, Real-time sync)
- **State Management**: React Context + AsyncStorage
- **Animations**: React Native Reanimated + SVG
- **Audio**: expo-av for sounds and music
- **Notifications**: expo-notifications

## Prerequisites

Before running this app, make sure you have:

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Expo CLI**: `npm install -g @expo/cli`
4. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)

## Setup Instructions

### 1. Install Dependencies

```bash
cd sleepy-sheep
npm install
```

### 2. Supabase Setup

1. Create a new project in your Supabase dashboard
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the database migration:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the migration

### 3. Asset Setup

Create the following directories and add placeholder files:

```bash
mkdir -p src/assets/sounds
mkdir -p src/assets/images
```

Add placeholder audio files:
- `src/assets/sounds/alarm_default.mp3`
- `src/assets/sounds/alarm_harp.mp3`
- `src/assets/sounds/alarm_xylophone.mp3`
- `src/assets/sounds/alarm_chime.mp3`
- `src/assets/sounds/rain.mp3`
- `src/assets/sounds/forest.mp3`
- `src/assets/sounds/waves.mp3`

Add placeholder images:
- `assets/icon.png` (1024x1024)
- `assets/splash.png` (1242x2436)
- `assets/adaptive-icon.png` (1024x1024)
- `assets/favicon.png` (48x48)
- `assets/notification-icon.png` (96x96)

### 4. Run the App

```bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## Project Structure

```
sleepy-sheep/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Sheep.tsx      # Main sheep character
│   │   ├── SleepButton.tsx
│   │   └── PointsDisplay.tsx
│   ├── screens/           # Main app screens
│   │   ├── HomeScreen.tsx
│   │   ├── SleepModeScreen.tsx
│   │   ├── MorningSummaryScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── RelaxationModal.tsx
│   ├── services/          # Business logic
│   │   ├── supabase.ts
│   │   ├── sleepTracking.ts
│   │   ├── pointsEngine.ts
│   │   ├── notificationService.ts
│   │   └── alarmService.ts
│   ├── contexts/          # Global state
│   │   ├── SleepContext.tsx
│   │   └── SheepContext.tsx
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Helper functions
│   └── assets/            # Images, sounds, animations
├── supabase/
│   └── migrations/        # Database schema
├── App.tsx              # Main app component
├── package.json
├── app.json
└── tsconfig.json
```

## Key Features Implementation

### Sleep Tracking
- Timer-based check-ins every 30 minutes (configurable)
- Points deduction for missed check-ins
- Session tracking with start/end times

### Points System
- **Time Adherence**: +10 for on-time, +5 for within 15min
- **Check-ins**: -1 point per 5 minutes of missed check-ins
- **Snoozes**: -3 for first snooze, -5 for additional
- **Streak Bonus**: +20 for 7-day streaks

### Sheep Evolution
- **Baby Sheep**: 0-99 points
- **Fluffy Sheep**: 100-249 points
- **Dreamy Sheep**: 250-499 points
- **Cloud Guardian**: 500+ points

### Unlockables
- **Accessories**: Hats, scarves, glasses, blankets
- **Themes**: Meadow, moonlit hill, cloud realm
- **Sounds**: Harp, xylophone, chime alarm sounds

## Development Notes

### Environment Variables
Make sure to set up your Supabase credentials in a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Testing
The app includes demo data for testing without a real user account. In production, you'll need to implement proper authentication.

### Audio Files
The app expects specific audio files in the `src/assets/sounds/` directory. You can use royalty-free sounds or create your own.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue in the GitHub repository.
