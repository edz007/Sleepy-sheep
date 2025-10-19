// import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getCurrentUser } from '../services/supabase';
import ErrorHandler from './errorHandler';

// Mock AsyncStorage for web compatibility
const AsyncStorage = {
  setItem: async (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage not available:', error);
    }
  },
  getItem: async (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage not available:', error);
      return null;
    }
  },
  removeItem: async (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage not available:', error);
    }
  },
};

export interface BackupData {
  user: any;
  sleepSessions: any[];
  userSettings: any;
  unlockables: any[];
  timestamp: string;
  version: string;
}

export interface SyncStatus {
  lastSync: string;
  pendingChanges: number;
  syncInProgress: boolean;
  lastError?: string;
}

export class DataPersistence {
  private static readonly STORAGE_KEYS = {
    USER_DATA: 'user_data',
    SLEEP_SESSIONS: 'sleep_sessions',
    USER_SETTINGS: 'user_settings',
    UNLOCKABLES: 'unlockables',
    BACKUP_DATA: 'backup_data',
    SYNC_STATUS: 'sync_status',
    OFFLINE_QUEUE: 'offline_queue',
  };

  private static readonly BACKUP_VERSION = '1.0.0';

  // Local storage operations
  static async saveToLocal(key: string, data: any): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to save ${key} locally`);
    }
  }

  static async loadFromLocal<T>(key: string): Promise<T | null> {
    try {
      const jsonData = await AsyncStorage.getItem(key);
      return jsonData ? JSON.parse(jsonData) : null;
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to load ${key} locally`);
      return null;
    }
  }

  static async removeFromLocal(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      ErrorHandler.handleError(error, `Failed to remove ${key} locally`);
    }
  }

  // Data backup operations
  static async createBackup(): Promise<BackupData | null> {
    try {
      const user = await getCurrentUser();
      if (!user) return null;

      const [sleepSessions, userSettings, unlockables] = await Promise.all([
        this.loadFromLocal(this.STORAGE_KEYS.SLEEP_SESSIONS),
        this.loadFromLocal(this.STORAGE_KEYS.USER_SETTINGS),
        this.loadFromLocal(this.STORAGE_KEYS.UNLOCKABLES),
      ]);

      const backupData: BackupData = {
        user,
        sleepSessions: sleepSessions || [],
        userSettings: userSettings || {},
        unlockables: unlockables || [],
        timestamp: new Date().toISOString(),
        version: this.BACKUP_VERSION,
      };

      await this.saveToLocal(this.STORAGE_KEYS.BACKUP_DATA, backupData);
      return backupData;
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to create backup');
      return null;
    }
  }

  static async restoreFromBackup(backupData: BackupData): Promise<boolean> {
    try {
      // Validate backup data
      if (!this.validateBackupData(backupData)) {
        throw new Error('Invalid backup data');
      }

      // Restore data to local storage
      await Promise.all([
        this.saveToLocal(this.STORAGE_KEYS.SLEEP_SESSIONS, backupData.sleepSessions),
        this.saveToLocal(this.STORAGE_KEYS.USER_SETTINGS, backupData.userSettings),
        this.saveToLocal(this.STORAGE_KEYS.UNLOCKABLES, backupData.unlockables),
      ]);

      // Sync to database
      await this.syncToDatabase();

      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to restore from backup');
      return false;
    }
  }

  static async getBackupData(): Promise<BackupData | null> {
    return await this.loadFromLocal(this.STORAGE_KEYS.BACKUP_DATA);
  }

  // Data synchronization
  static async syncToDatabase(): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      if (!user) return false;

      const syncStatus = await this.getSyncStatus();
      syncStatus.syncInProgress = true;
      syncStatus.lastSync = new Date().toISOString();
      await this.saveToLocal(this.STORAGE_KEYS.SYNC_STATUS, syncStatus);

      // Sync sleep sessions
      await this.syncSleepSessions(user.id);

      // Sync user settings
      await this.syncUserSettings(user.id);

      // Sync unlockables
      await this.syncUnlockables(user.id);

      // Clear offline queue
      await this.clearOfflineQueue();

      syncStatus.syncInProgress = false;
      syncStatus.pendingChanges = 0;
      await this.saveToLocal(this.STORAGE_KEYS.SYNC_STATUS, syncStatus);

      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to sync to database');
      
      const syncStatus = await this.getSyncStatus();
      syncStatus.syncInProgress = false;
      syncStatus.lastError = error.message;
      await this.saveToLocal(this.STORAGE_KEYS.SYNC_STATUS, syncStatus);

      return false;
    }
  }

  static async syncFromDatabase(): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      if (!user) return false;

      // Fetch latest data from database
      const [sleepSessionsResult, userSettingsResult, unlockablesResult] = await Promise.all([
        supabase.from('sleep_sessions').select('*').eq('user_id', user.id),
        supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('unlockables').select('*').eq('user_id', user.id),
      ]);

      // Save to local storage
      if (sleepSessionsResult.data) {
        await this.saveToLocal(this.STORAGE_KEYS.SLEEP_SESSIONS, sleepSessionsResult.data);
      }

      if (userSettingsResult.data) {
        await this.saveToLocal(this.STORAGE_KEYS.USER_SETTINGS, userSettingsResult.data);
      }

      if (unlockablesResult.data) {
        await this.saveToLocal(this.STORAGE_KEYS.UNLOCKABLES, unlockablesResult.data);
      }

      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to sync from database');
      return false;
    }
  }

  // Offline queue management
  static async addToOfflineQueue(operation: {
    type: 'create' | 'update' | 'delete';
    table: string;
    data: any;
    id?: string;
  }): Promise<void> {
    try {
      const queue = await this.loadFromLocal<any[]>(this.STORAGE_KEYS.OFFLINE_QUEUE) || [];
      queue.push({
        ...operation,
        timestamp: new Date().toISOString(),
        id: operation.id || `offline_${Date.now()}`,
      });
      await this.saveToLocal(this.STORAGE_KEYS.OFFLINE_QUEUE, queue);

      // Update sync status
      const syncStatus = await this.getSyncStatus();
      syncStatus.pendingChanges = queue.length;
      await this.saveToLocal(this.STORAGE_KEYS.SYNC_STATUS, syncStatus);
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to add to offline queue');
    }
  }

  static async processOfflineQueue(): Promise<void> {
    try {
      const queue = await this.loadFromLocal<any[]>(this.STORAGE_KEYS.OFFLINE_QUEUE) || [];
      
      for (const operation of queue) {
        try {
          await this.executeOfflineOperation(operation);
        } catch (error) {
          console.error('Failed to execute offline operation:', operation, error);
        }
      }

      await this.clearOfflineQueue();
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to process offline queue');
    }
  }

  static async clearOfflineQueue(): Promise<void> {
    await this.removeFromLocal(this.STORAGE_KEYS.OFFLINE_QUEUE);
  }

  // Sync status management
  static async getSyncStatus(): Promise<SyncStatus> {
    const defaultStatus: SyncStatus = {
      lastSync: '',
      pendingChanges: 0,
      syncInProgress: false,
    };

    return await this.loadFromLocal(this.STORAGE_KEYS.SYNC_STATUS) || defaultStatus;
  }

  static async updateSyncStatus(updates: Partial<SyncStatus>): Promise<void> {
    const currentStatus = await this.getSyncStatus();
    const newStatus = { ...currentStatus, ...updates };
    await this.saveToLocal(this.STORAGE_KEYS.SYNC_STATUS, newStatus);
  }

  // Data validation
  private static validateBackupData(data: any): data is BackupData {
    return (
      data &&
      typeof data === 'object' &&
      data.user &&
      Array.isArray(data.sleepSessions) &&
      typeof data.userSettings === 'object' &&
      Array.isArray(data.unlockables) &&
      typeof data.timestamp === 'string' &&
      typeof data.version === 'string'
    );
  }

  // Private sync methods
  private static async syncSleepSessions(userId: string): Promise<void> {
    const localSessions = await this.loadFromLocal(this.STORAGE_KEYS.SLEEP_SESSIONS) || [];
    
    for (const session of localSessions) {
      try {
        const { error } = await supabase
          .from('sleep_sessions')
          .upsert({ ...session, user_id: userId });

        if (error) throw error;
      } catch (error) {
        console.error('Failed to sync sleep session:', session, error);
      }
    }
  }

  private static async syncUserSettings(userId: string): Promise<void> {
    const localSettings = await this.loadFromLocal(this.STORAGE_KEYS.USER_SETTINGS);
    
    if (localSettings) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({ ...localSettings, user_id: userId });

        if (error) throw error;
      } catch (error) {
        console.error('Failed to sync user settings:', localSettings, error);
      }
    }
  }

  private static async syncUnlockables(userId: string): Promise<void> {
    const localUnlockables = await this.loadFromLocal(this.STORAGE_KEYS.UNLOCKABLES) || [];
    
    for (const unlockable of localUnlockables) {
      try {
        const { error } = await supabase
          .from('unlockables')
          .upsert({ ...unlockable, user_id: userId });

        if (error) throw error;
      } catch (error) {
        console.error('Failed to sync unlockable:', unlockable, error);
      }
    }
  }

  private static async executeOfflineOperation(operation: any): Promise<void> {
    const { type, table, data, id } = operation;

    switch (type) {
      case 'create':
        await supabase.from(table).insert(data);
        break;
      case 'update':
        await supabase.from(table).update(data).eq('id', id);
        break;
      case 'delete':
        await supabase.from(table).delete().eq('id', id);
        break;
    }
  }

  // Data export/import
  static async exportData(): Promise<string> {
    try {
      const backupData = await this.createBackup();
      if (!backupData) throw new Error('Failed to create backup');

      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to export data');
      throw error;
    }
  }

  static async importData(jsonData: string): Promise<boolean> {
    try {
      const backupData = JSON.parse(jsonData);
      return await this.restoreFromBackup(backupData);
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to import data');
      return false;
    }
  }

  // Cleanup operations
  static async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const sleepSessions = await this.loadFromLocal(this.STORAGE_KEYS.SLEEP_SESSIONS) || [];
      const filteredSessions = sleepSessions.filter((session: any) => 
        new Date(session.created_at) > cutoffDate
      );

      await this.saveToLocal(this.STORAGE_KEYS.SLEEP_SESSIONS, filteredSessions);
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to cleanup old data');
    }
  }

  // Health check
  static async checkDataHealth(): Promise<{
    localData: boolean;
    databaseConnection: boolean;
    syncStatus: boolean;
  }> {
    try {
      const localData = await this.loadFromLocal(this.STORAGE_KEYS.USER_DATA) !== null;
      const databaseConnection = await ErrorHandler.checkDatabaseHealth();
      const syncStatus = await this.getSyncStatus();

      return {
        localData,
        databaseConnection,
        syncStatus: !syncStatus.lastError,
      };
    } catch (error) {
      ErrorHandler.handleError(error, 'Failed to check data health');
      return {
        localData: false,
        databaseConnection: false,
        syncStatus: false,
      };
    }
  }
}

export default DataPersistence;
