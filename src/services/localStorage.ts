// Local storage service for demo purposes when Supabase auth is not available

export interface LocalSettings {
  bedtime_target: string;
  wake_time_target: string;
  notification_enabled: boolean;
  check_in_interval: number;
  updated_at: string;
}

const STORAGE_KEY = 'sleepy-sheep-settings';

export const LocalStorageService = {
  // Save settings to local storage
  saveSettings: async (settings: Partial<LocalSettings>): Promise<void> => {
    try {
      const existingSettings = await LocalStorageService.getSettings();
      const updatedSettings = {
        ...existingSettings,
        ...settings,
        updated_at: new Date().toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      console.log('Settings saved to local storage:', updatedSettings);
    } catch (error) {
      console.error('Error saving to local storage:', error);
      throw error;
    }
  },

  // Load settings from local storage
  getSettings: async (): Promise<LocalSettings> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        console.log('Settings loaded from local storage:', settings);
        return settings;
      }
      
      // Return default settings if none exist
      const defaultSettings: LocalSettings = {
        bedtime_target: '22:00',
        wake_time_target: '07:00',
        notification_enabled: true,
        check_in_interval: 30,
        updated_at: new Date().toISOString(),
      };
      
      console.log('No settings found, using defaults:', defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error loading from local storage:', error);
      // Return default settings on error
      return {
        bedtime_target: '22:00',
        wake_time_target: '07:00',
        notification_enabled: true,
        check_in_interval: 30,
        updated_at: new Date().toISOString(),
      };
    }
  },

  // Clear all settings
  clearSettings: async (): Promise<void> => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Settings cleared from local storage');
    } catch (error) {
      console.error('Error clearing local storage:', error);
    }
  },
};
