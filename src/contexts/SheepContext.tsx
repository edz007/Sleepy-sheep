import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '../services/supabase';
import { SheepContextType } from '../types';
import { SheepEvolution } from '../utils/pointsCalculator';

const SheepContext = createContext<SheepContextType | undefined>(undefined);

export const SheepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sheepStage, setSheepStage] = useState<SheepContextType['sheepStage']>('baby');
  const [sheepMood, setSheepMood] = useState<SheepContextType['sheepMood']>('happy');
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showEvolution, setShowEvolution] = useState(false);
  const [evolutionMessage, setEvolutionMessage] = useState('');

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Skip Supabase queries for local users
      if (user.id === 'local-user') {
        console.log('Skipping user data load for local user, using defaults');
        // Set default values for local user
        setTotalPoints(0);
        setCurrentStreak(0);
        setSheepStage('baby');
        setSheepMood('happy');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('total_points, current_streak, sheep_stage')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setTotalPoints(data.total_points || 0);
        setCurrentStreak(data.current_streak || 0);
        setSheepStage(data.sheep_stage || 'baby');
        updateSheepMoodBasedOnStats(data.total_points || 0, data.current_streak || 0);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const updateSheepMoodBasedOnStats = (points: number, streak: number) => {
    console.log('updateSheepMoodBasedOnStats called with points:', points, 'streak:', streak);
    console.log('Current sheepMood before update:', sheepMood);
    if (streak >= 7) {
      console.log('Setting sheep mood to excited');
      setSheepMood('excited');
    } else if (points < 10) {
      console.log('Setting sheep mood to sad');
      setSheepMood('sad');
    } else if (streak >= 3) {
      console.log('Setting sheep mood to happy');
      setSheepMood('happy');
    } else {
      console.log('Setting sheep mood to happy (default)');
      setSheepMood('happy');
    }
  };

  const updateSheepStage = async (stage: SheepContextType['sheepStage']) => {
    try {
      setSheepStage(stage);
      
      const user = await getCurrentUser();
      if (!user) return;

      // Skip Supabase queries for local users
      if (user.id === 'local-user') {
        console.log('Skipping sheep stage update for local user');
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ sheep_stage: stage })
        .eq('id', user.id);

      if (error) throw error;

      console.log('Sheep stage updated to:', stage);
    } catch (error) {
      console.error('Error updating sheep stage:', error);
    }
  };

  const updateSheepMood = (mood: SheepContextType['sheepMood']) => {
    setSheepMood(mood);
    console.log('Sheep mood updated to:', mood);
  };

  const handleSheepDeath = async () => {
    try {
      console.log('💀 Handling sheep death - resetting to level 1');
      
      // Reset sheep to baby stage (level 1)
      setSheepStage('baby');
      setSheepMood('sad');
      setCurrentStreak(0);
      setTotalPoints(10); // Reset points to 10 after death
      
      // Show death animation/celebration
      setEvolutionMessage('💀 Your sheep has died from poor sleep habits! Resurrected as a baby sheep.');
      setShowEvolution(true);
      
      // Auto-hide death message after 5 seconds
      setTimeout(() => {
        setShowEvolution(false);
        setEvolutionMessage('');
      }, 5000);
      
      const user = await getCurrentUser();
      if (!user) return;

      // Skip Supabase queries for local users
      if (user.id === 'local-user') {
        console.log('Skipping death update for local user, sheep reset locally');
        return;
      }

      // Update database with reset values
      const { error } = await supabase
        .from('users')
        .update({ 
          sheep_stage: 'baby',
          current_streak: 0,
          total_points: 10
        })
        .eq('id', user.id);

      if (error) throw error;

      console.log('Sheep death handled - reset to baby stage');
    } catch (error) {
      console.error('Error handling sheep death:', error);
    }
  };

  const addPoints = async (points: number) => {
    try {
      const newTotalPoints = totalPoints + points;
      setTotalPoints(newTotalPoints);
      
      // Check for death state (points <= -200)
      if (newTotalPoints <= -200) {
        console.log('💀 Sheep has died! Points reached:', newTotalPoints);
        handleSheepDeath();
        return;
      }
      
      // Update sheep mood based on new stats
      updateSheepMoodBasedOnStats(newTotalPoints, currentStreak);
      
      // Check if sheep should evolve
      checkSheepEvolution(newTotalPoints);

      const user = await getCurrentUser();
      if (!user) return;

      // Skip Supabase queries for local users
      if (user.id === 'local-user') {
        console.log('Skipping points update for local user, points added locally:', points);
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ total_points: newTotalPoints })
        .eq('id', user.id);

      if (error) throw error;

      console.log('Points added:', points, 'Total:', newTotalPoints);
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const updateStreak = async (streak: number) => {
    try {
      setCurrentStreak(streak);
      
      const user = await getCurrentUser();
      if (!user) return;

      // Skip Supabase queries for local users
      if (user.id === 'local-user') {
        console.log('Skipping streak update for local user, streak updated locally:', streak);
        // Update mood based on new streak
        updateSheepMoodBasedOnStats(totalPoints, streak);
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ current_streak: streak })
        .eq('id', user.id);

      if (error) throw error;

      // Update mood based on new streak
      updateSheepMoodBasedOnStats(totalPoints, streak);

      console.log('Streak updated to:', streak);
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const checkSheepEvolution = (points: number) => {
    console.log('checkSheepEvolution called with points:', points);
    console.log('Current sheepStage:', sheepStage);
    const newStage = SheepEvolution.getSheepStage(points);
    console.log('New sheepStage:', newStage);

    if (newStage !== sheepStage) {
      console.log('Sheep is evolving! Setting mood to excited');
      updateSheepStage(newStage);
      setSheepMood('excited'); // Sheep gets excited when evolving
      
      // Show evolution message
      const message = SheepEvolution.getEvolutionMessage(newStage);
      setEvolutionMessage(message);
      setShowEvolution(true);
      
      // Auto-hide evolution message after 3 seconds and reset mood
      setTimeout(() => {
        setShowEvolution(false);
        // Reset mood back to stats-based mood after evolution celebration
        console.log('Evolution celebration ended, resetting mood to stats-based');
        updateSheepMoodBasedOnStats(points, currentStreak);
      }, 3000);
    } else {
      console.log('No evolution - sheep stage unchanged');
    }
  };

  const value: SheepContextType = {
    sheepStage,
    sheepMood,
    totalPoints,
    currentStreak,
    updateSheepStage,
    updateSheepMood,
    addPoints,
    updateStreak,
  };

  return (
    <SheepContext.Provider value={value}>
      {children}
    </SheepContext.Provider>
  );
};

export const useSheep = () => {
  const context = useContext(SheepContext);
  if (context === undefined) {
    throw new Error('useSheep must be used within a SheepProvider');
  }
  return context;
};