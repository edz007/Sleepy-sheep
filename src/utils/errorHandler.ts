import { Alert } from 'react-native';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userId?: string;
}

export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static maxLogSize = 100;

  // Validation functions
  static validateBedtime(time: string): ValidationError | null {
    if (!time) {
      return {
        field: 'bedtime',
        message: 'Bedtime is required',
        code: 'REQUIRED_FIELD'
      };
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return {
        field: 'bedtime',
        message: 'Bedtime must be in HH:MM format',
        code: 'INVALID_FORMAT'
      };
    }

    const [hours, minutes] = time.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return {
        field: 'bedtime',
        message: 'Invalid time values',
        code: 'INVALID_TIME'
      };
    }

    return null;
  }

  static validateWakeTime(time: string): ValidationError | null {
    if (!time) {
      return {
        field: 'wakeTime',
        message: 'Wake time is required',
        code: 'REQUIRED_FIELD'
      };
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return {
        field: 'wakeTime',
        message: 'Wake time must be in HH:MM format',
        code: 'INVALID_FORMAT'
      };
    }

    const [hours, minutes] = time.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return {
        field: 'wakeTime',
        message: 'Invalid time values',
        code: 'INVALID_TIME'
      };
    }

    return null;
  }

  static validateCheckInInterval(interval: number): ValidationError | null {
    if (interval < 5 || interval > 60) {
      return {
        field: 'checkInInterval',
        message: 'Check-in interval must be between 5 and 60 minutes',
        code: 'INVALID_RANGE'
      };
    }

    return null;
  }

  static validateSleepSession(session: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!session.bedtime) {
      errors.push({
        field: 'bedtime',
        message: 'Bedtime is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!session.sleep_date) {
      errors.push({
        field: 'sleep_date',
        message: 'Sleep date is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (session.check_ins_missed < 0) {
      errors.push({
        field: 'check_ins_missed',
        message: 'Check-ins missed cannot be negative',
        code: 'INVALID_VALUE'
      });
    }

    if (session.snooze_count < 0) {
      errors.push({
        field: 'snooze_count',
        message: 'Snooze count cannot be negative',
        code: 'INVALID_VALUE'
      });
    }

    return errors;
  }

  // Error handling functions
  static handleError(error: any, context?: string): void {
    const appError: AppError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error,
      timestamp: new Date().toISOString(),
    };

    this.logError(appError);

    // Show user-friendly error message
    this.showErrorToUser(error, context);
  }

  static handleValidationErrors(errors: ValidationError[]): void {
    if (errors.length === 0) return;

    const errorMessages = errors.map(error => `${error.field}: ${error.message}`).join('\n');
    
    Alert.alert(
      'Validation Error',
      errorMessages,
      [{ text: 'OK' }]
    );
  }

  static handleNetworkError(error: any): void {
    const networkError: AppError = {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed',
      details: error,
      timestamp: new Date().toISOString(),
    };

    this.logError(networkError);

    Alert.alert(
      'Connection Error',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  }

  static handleDatabaseError(error: any): void {
    const dbError: AppError = {
      code: 'DATABASE_ERROR',
      message: 'Database operation failed',
      details: error,
      timestamp: new Date().toISOString(),
    };

    this.logError(dbError);

    Alert.alert(
      'Data Error',
      'There was a problem saving your data. Please try again.',
      [{ text: 'OK' }]
    );
  }

  static handlePermissionError(error: any): void {
    const permissionError: AppError = {
      code: 'PERMISSION_ERROR',
      message: 'Permission denied',
      details: error,
      timestamp: new Date().toISOString(),
    };

    this.logError(permissionError);

    Alert.alert(
      'Permission Required',
      'This feature requires permission. Please enable it in your device settings.',
      [{ text: 'OK' }]
    );
  }

  // Logging functions
  static logError(error: AppError): void {
    this.errorLog.unshift(error);
    
    // Keep only the most recent errors
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('App Error:', error);
    }
  }

  static getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  static clearErrorLog(): void {
    this.errorLog = [];
  }

  // User-friendly error messages
  private static showErrorToUser(error: any, context?: string): void {
    let title = 'Error';
    let message = 'Something went wrong. Please try again.';

    switch (error.code) {
      case 'NETWORK_ERROR':
        title = 'Connection Error';
        message = 'Please check your internet connection and try again.';
        break;
      case 'DATABASE_ERROR':
        title = 'Data Error';
        message = 'There was a problem saving your data. Please try again.';
        break;
      case 'PERMISSION_ERROR':
        title = 'Permission Required';
        message = 'This feature requires permission. Please enable it in your device settings.';
        break;
      case 'VALIDATION_ERROR':
        title = 'Invalid Input';
        message = 'Please check your input and try again.';
        break;
      case 'AUTH_ERROR':
        title = 'Authentication Error';
        message = 'Please log in again to continue.';
        break;
      default:
        if (error.message) {
          message = error.message;
        }
    }

    if (context) {
      message = `${context}: ${message}`;
    }

    Alert.alert(title, message, [{ text: 'OK' }]);
  }

  // Recovery functions
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError;
  }

  static async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>
  ): Promise<T> {
    try {
      return await primaryOperation();
    } catch (error) {
      console.warn('Primary operation failed, using fallback:', error);
      return await fallbackOperation();
    }
  }

  // Data validation helpers
  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  static isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date) && !isNaN(Date.parse(date));
  }

  // Error reporting for analytics
  static reportError(error: AppError, userId?: string): void {
    // This would integrate with your analytics service
    if (__DEV__) {
      console.log('Error reported:', { ...error, userId });
    }
  }

  // Health check functions
  static async checkDatabaseHealth(): Promise<boolean> {
    try {
      // This would check if the database is accessible
      return true;
    } catch (error) {
      this.handleError(error, 'Database health check');
      return false;
    }
  }

  static async checkNetworkHealth(): Promise<boolean> {
    try {
      // This would check if the network is accessible
      return true;
    } catch (error) {
      this.handleError(error, 'Network health check');
      return false;
    }
  }
}

export default ErrorHandler;
