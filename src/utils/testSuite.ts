import { PointsCalculator, StreakCalculator, SheepEvolution } from '../utils/pointsCalculator';
import ErrorHandler from '../utils/errorHandler';
import DataPersistence from '../utils/dataPersistence';

// Mock data for testing
const mockSleepSession = {
  id: 'test-session-1',
  user_id: 'test-user-1',
  bedtime: '2024-01-01T22:00:00Z',
  wake_time: '2024-01-02T07:00:00Z',
  points_earned: 0,
  sleep_date: '2024-01-01',
  check_ins_missed: 0,
  snooze_count: 0,
  created_at: '2024-01-01T22:00:00Z',
};

const mockUserSettings = {
  user_id: 'test-user-1',
  bedtime_target: '22:00',
  wake_time_target: '07:00',
  notification_enabled: true,
  check_in_interval: 15,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export class TestSuite {
  private static testResults: TestResult[] = [];
  private static currentTestGroup = '';

  static async runAllTests(): Promise<TestReport> {
    console.log('🧪 Starting SleepySheep Test Suite...');
    
    this.testResults = [];
    
    // Run all test groups
    await this.runPointsCalculatorTests();
    await this.runStreakCalculatorTests();
    await this.runSheepEvolutionTests();
    await this.runErrorHandlerTests();
    await this.runDataPersistenceTests();
    await this.runValidationTests();
    await this.runIntegrationTests();
    
    return this.generateReport();
  }

  // Points Calculator Tests
  static async runPointsCalculatorTests(): Promise<void> {
    this.currentTestGroup = 'Points Calculator';
    
    // Test bedtime accuracy points
    this.runTest('Bedtime Accuracy - Perfect', () => {
      const session = { ...mockSleepSession, bedtime: '2024-01-01T22:00:00Z' };
      const settings = { ...mockUserSettings, bedtime_target: '22:00' };
      const result = PointsCalculator.calculateBedtimePoints(session, settings);
      return result === 10;
    });

    this.runTest('Bedtime Accuracy - Within 15 min', () => {
      const session = { ...mockSleepSession, bedtime: '2024-01-01T22:10:00Z' };
      const settings = { ...mockUserSettings, bedtime_target: '22:00' };
      const result = PointsCalculator.calculateBedtimePoints(session, settings);
      return result === 5;
    });

    this.runTest('Bedtime Accuracy - Within 30 min', () => {
      const session = { ...mockSleepSession, bedtime: '2024-01-01T22:25:00Z' };
      const settings = { ...mockUserSettings, bedtime_target: '22:00' };
      const result = PointsCalculator.calculateBedtimePoints(session, settings);
      return result === 2;
    });

    this.runTest('Bedtime Accuracy - Late', () => {
      const session = { ...mockSleepSession, bedtime: '2024-01-01T23:00:00Z' };
      const settings = { ...mockUserSettings, bedtime_target: '22:00' };
      const result = PointsCalculator.calculateBedtimePoints(session, settings);
      return result === 0;
    });

    // Test check-in points
    this.runTest('Check-in Points - Perfect', () => {
      const session = { ...mockSleepSession, check_ins_missed: 0 };
      const result = PointsCalculator.calculateCheckInPoints(session);
      return result === 5;
    });

    this.runTest('Check-in Points - Some Missed', () => {
      const session = { ...mockSleepSession, check_ins_missed: 2 };
      const result = PointsCalculator.calculateCheckInPoints(session);
      return result === 3;
    });

    this.runTest('Check-in Points - Many Missed', () => {
      const session = { ...mockSleepSession, check_ins_missed: 5 };
      const result = PointsCalculator.calculateCheckInPoints(session);
      return result === 0;
    });

    // Test snooze penalties
    this.runTest('Snooze Penalty - No Snoozes', () => {
      const session = { ...mockSleepSession, snooze_count: 0 };
      const result = PointsCalculator.calculateSnoozePenalty(session);
      return result === 0;
    });

    this.runTest('Snooze Penalty - One Snooze', () => {
      const session = { ...mockSleepSession, snooze_count: 1 };
      const result = PointsCalculator.calculateSnoozePenalty(session);
      return result === -3;
    });

    this.runTest('Snooze Penalty - Multiple Snoozes', () => {
      const session = { ...mockSleepSession, snooze_count: 3 };
      const result = PointsCalculator.calculateSnoozePenalty(session);
      return result === -9;
    });
  }

  // Streak Calculator Tests
  static async runStreakCalculatorTests(): Promise<void> {
    this.currentTestGroup = 'Streak Calculator';
    
    this.runTest('Streak Calculation - Consecutive Days', () => {
      const result = StreakCalculator.calculateStreak(
        '2024-01-01',
        '2024-01-03',
        0
      );
      return result.currentStreak === 3;
    });

    this.runTest('Streak Calculation - Broken Streak', () => {
      const result = StreakCalculator.calculateStreak(
        '2024-01-01',
        '2024-01-05',
        3
      );
      return result.currentStreak === 1;
    });

    this.runTest('Streak Milestone - 3 Days', () => {
      const result = StreakCalculator.checkStreakMilestone(3, 2);
      return result === 3;
    });

    this.runTest('Streak Milestone - 7 Days', () => {
      const result = StreakCalculator.checkStreakMilestone(7, 6);
      return result === 7;
    });

    this.runTest('Streak Milestone - No Milestone', () => {
      const result = StreakCalculator.checkStreakMilestone(5, 4);
      return result === null;
    });
  }

  // Sheep Evolution Tests
  static async runSheepEvolutionTests(): Promise<void> {
    this.currentTestGroup = 'Sheep Evolution';
    
    this.runTest('Sheep Stage - Baby', () => {
      const stage = SheepEvolution.getSheepStage(25);
      return stage === 'baby';
    });

    this.runTest('Sheep Stage - Fluffy', () => {
      const stage = SheepEvolution.getSheepStage(75);
      return stage === 'fluffy';
    });

    this.runTest('Sheep Stage - Dreamy', () => {
      const stage = SheepEvolution.getSheepStage(250);
      return stage === 'dreamy';
    });

    this.runTest('Sheep Stage - Cloud Guardian', () => {
      const stage = SheepEvolution.getSheepStage(600);
      return stage === 'cloud_guardian';
    });

    this.runTest('Points to Next Stage - Baby to Fluffy', () => {
      const points = SheepEvolution.getPointsToNextStage('baby', 25);
      return points === 25;
    });

    this.runTest('Points to Next Stage - Fluffy to Dreamy', () => {
      const points = SheepEvolution.getPointsToNextStage('fluffy', 75);
      return points === 125;
    });
  }

  // Error Handler Tests
  static async runErrorHandlerTests(): Promise<void> {
    this.currentTestGroup = 'Error Handler';
    
    this.runTest('Bedtime Validation - Valid', () => {
      const result = ErrorHandler.validateBedtime('22:00');
      return result === null;
    });

    this.runTest('Bedtime Validation - Invalid Format', () => {
      const result = ErrorHandler.validateBedtime('22:00:00');
      return result !== null && result.code === 'INVALID_FORMAT';
    });

    this.runTest('Bedtime Validation - Invalid Time', () => {
      const result = ErrorHandler.validateBedtime('25:00');
      return result !== null && result.code === 'INVALID_TIME';
    });

    this.runTest('Wake Time Validation - Valid', () => {
      const result = ErrorHandler.validateWakeTime('07:00');
      return result === null;
    });

    this.runTest('Check-in Interval Validation - Valid', () => {
      const result = ErrorHandler.validateCheckInInterval(15);
      return result === null;
    });

    this.runTest('Check-in Interval Validation - Invalid', () => {
      const result = ErrorHandler.validateCheckInInterval(3);
      return result !== null && result.code === 'INVALID_RANGE';
    });

    this.runTest('Sleep Session Validation - Valid', () => {
      const errors = ErrorHandler.validateSleepSession(mockSleepSession);
      return errors.length === 0;
    });

    this.runTest('Sleep Session Validation - Invalid', () => {
      const invalidSession = { ...mockSleepSession, bedtime: null };
      const errors = ErrorHandler.validateSleepSession(invalidSession);
      return errors.length > 0;
    });
  }

  // Data Persistence Tests
  static async runDataPersistenceTests(): Promise<void> {
    this.currentTestGroup = 'Data Persistence';
    
    this.runTest('Local Storage - Save and Load', async () => {
      const testData = { test: 'data', number: 123 };
      await DataPersistence.saveToLocal('test_key', testData);
      const loadedData = await DataPersistence.loadFromLocal('test_key');
      return JSON.stringify(loadedData) === JSON.stringify(testData);
    });

    this.runTest('Local Storage - Remove', async () => {
      await DataPersistence.saveToLocal('test_key_remove', { test: 'data' });
      await DataPersistence.removeFromLocal('test_key_remove');
      const loadedData = await DataPersistence.loadFromLocal('test_key_remove');
      return loadedData === null;
    });

    this.runTest('Backup Data Validation - Valid', () => {
      const validBackup = {
        user: { id: 'test' },
        sleepSessions: [],
        userSettings: {},
        unlockables: [],
        timestamp: '2024-01-01T00:00:00Z',
        version: '1.0.0',
      };
      return DataPersistence['validateBackupData'](validBackup);
    });

    this.runTest('Backup Data Validation - Invalid', () => {
      const invalidBackup = {
        user: { id: 'test' },
        // Missing required fields
      };
      return !DataPersistence['validateBackupData'](invalidBackup);
    });
  }

  // Validation Tests
  static async runValidationTests(): Promise<void> {
    this.currentTestGroup = 'Validation';
    
    this.runTest('Input Sanitization', () => {
      const input = '  <script>alert("test")</script>  ';
      const sanitized = ErrorHandler.sanitizeInput(input);
      return sanitized === 'scriptalert("test")/script';
    });

    this.runTest('Email Validation - Valid', () => {
      return ErrorHandler.isValidEmail('test@example.com');
    });

    this.runTest('Email Validation - Invalid', () => {
      return !ErrorHandler.isValidEmail('invalid-email');
    });

    this.runTest('Time Validation - Valid', () => {
      return ErrorHandler.isValidTime('22:30');
    });

    this.runTest('Time Validation - Invalid', () => {
      return !ErrorHandler.isValidTime('25:00');
    });

    this.runTest('Date Validation - Valid', () => {
      return ErrorHandler.isValidDate('2024-01-01');
    });

    this.runTest('Date Validation - Invalid', () => {
      return !ErrorHandler.isValidDate('invalid-date');
    });
  }

  // Integration Tests
  static async runIntegrationTests(): Promise<void> {
    this.currentTestGroup = 'Integration';
    
    this.runTest('Complete Points Calculation', () => {
      const session = {
        ...mockSleepSession,
        bedtime: '2024-01-01T22:00:00Z',
        check_ins_missed: 0,
        snooze_count: 0,
      };
      const settings = { ...mockUserSettings, bedtime_target: '22:00' };
      const result = PointsCalculator.calculateSessionPoints(session, settings, 0, 0);
      return result.totalPoints === 15; // 10 bedtime + 5 check-in
    });

    this.runTest('Points with Penalties', () => {
      const session = {
        ...mockSleepSession,
        bedtime: '2024-01-01T22:30:00Z',
        check_ins_missed: 2,
        snooze_count: 2,
      };
      const settings = { ...mockUserSettings, bedtime_target: '22:00' };
      const result = PointsCalculator.calculateSessionPoints(session, settings, 0, 0);
      return result.totalPoints === 1; // 2 bedtime + 3 check-in - 5 snooze
    });

    this.runTest('Streak Bonus Points', () => {
      const session = { ...mockSleepSession };
      const settings = { ...mockUserSettings };
      const result = PointsCalculator.calculateSessionPoints(session, settings, 7, 0);
      return result.streakBonus === 20; // 7-day streak bonus
    });
  }

  // Test execution helper
  private static runTest(testName: string, testFunction: () => boolean | Promise<boolean>): void {
    try {
      const result = testFunction();
      const isAsync = result instanceof Promise;
      
      if (isAsync) {
        result.then((passed) => {
          this.testResults.push({
            group: this.currentTestGroup,
            name: testName,
            passed,
            error: null,
          });
        }).catch((error) => {
          this.testResults.push({
            group: this.currentTestGroup,
            name: testName,
            passed: false,
            error: error.message,
          });
        });
      } else {
        this.testResults.push({
          group: this.currentTestGroup,
          name: testName,
          passed: result,
          error: null,
        });
      }
    } catch (error) {
      this.testResults.push({
        group: this.currentTestGroup,
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Report generation
  private static generateReport(): TestReport {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(test => test.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const report: TestReport = {
      totalTests,
      passedTests,
      failedTests,
      successRate,
      results: this.testResults,
      timestamp: new Date().toISOString(),
    };

    console.log('📊 Test Report Generated:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate.toFixed(2)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.group}: ${test.name}`);
          if (test.error) {
            console.log(`    Error: ${test.error}`);
          }
        });
    }

    return report;
  }

  // Individual test group runners
  static async runPointsTests(): Promise<TestReport> {
    this.testResults = [];
    this.currentTestGroup = 'Points Calculator';
    await this.runPointsCalculatorTests();
    return this.generateReport();
  }

  static async runStreakTests(): Promise<TestReport> {
    this.testResults = [];
    this.currentTestGroup = 'Streak Calculator';
    await this.runStreakCalculatorTests();
    return this.generateReport();
  }

  static async runEvolutionTests(): Promise<TestReport> {
    this.testResults = [];
    this.currentTestGroup = 'Sheep Evolution';
    await this.runSheepEvolutionTests();
    return this.generateReport();
  }

  static async runErrorTests(): Promise<TestReport> {
    this.testResults = [];
    this.currentTestGroup = 'Error Handler';
    await this.runErrorHandlerTests();
    return this.generateReport();
  }

  static async runValidationTests(): Promise<TestReport> {
    this.testResults = [];
    this.currentTestGroup = 'Validation';
    await this.runValidationTests();
    return this.generateReport();
  }
}

export interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  error: string | null;
}

export interface TestReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  results: TestResult[];
  timestamp: string;
}

export default TestSuite;
