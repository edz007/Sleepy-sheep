import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert 
} from 'react-native';
import { useSheep } from '../contexts/SheepContext';
import { supabase, getCurrentUser } from '../services/supabase';

interface Accessory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  pointsRequired: number;
  category: 'hat' | 'glasses' | 'jewelry' | 'clothing' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface SheepAccessoriesProps {
  visible: boolean;
  onClose: () => void;
}

const SheepAccessories: React.FC<SheepAccessoriesProps> = ({
  visible,
  onClose,
}) => {
  const { totalPoints, sheepStage } = useSheep();
  const [unlockedAccessories, setUnlockedAccessories] = useState<string[]>([]);
  const [equippedAccessories, setEquippedAccessories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Available accessories
  const accessories: Accessory[] = [
    // Hats
    { id: 'top_hat', name: 'Top Hat', emoji: '🎩', description: 'A fancy top hat for your sheep', pointsRequired: 100, category: 'hat', rarity: 'common' },
    { id: 'crown', name: 'Crown', emoji: '👑', description: 'A royal crown for your sheep', pointsRequired: 500, category: 'hat', rarity: 'legendary' },
    { id: 'party_hat', name: 'Party Hat', emoji: '🎉', description: 'A festive party hat', pointsRequired: 200, category: 'hat', rarity: 'rare' },
    { id: 'wizard_hat', name: 'Wizard Hat', emoji: '🧙‍♂️', description: 'A magical wizard hat', pointsRequired: 300, category: 'hat', rarity: 'epic' },
    
    // Glasses
    { id: 'sunglasses', name: 'Sunglasses', emoji: '🕶️', description: 'Cool sunglasses for your sheep', pointsRequired: 150, category: 'glasses', rarity: 'common' },
    { id: 'reading_glasses', name: 'Reading Glasses', emoji: '🤓', description: 'Smart reading glasses', pointsRequired: 250, category: 'glasses', rarity: 'rare' },
    { id: '3d_glasses', name: '3D Glasses', emoji: '🥽', description: 'Futuristic 3D glasses', pointsRequired: 400, category: 'glasses', rarity: 'epic' },
    
    // Jewelry
    { id: 'bow_tie', name: 'Bow Tie', emoji: '🎀', description: 'A dapper bow tie', pointsRequired: 120, category: 'jewelry', rarity: 'common' },
    { id: 'necklace', name: 'Necklace', emoji: '📿', description: 'A beautiful necklace', pointsRequired: 300, category: 'jewelry', rarity: 'rare' },
    { id: 'earrings', name: 'Earrings', emoji: '💎', description: 'Sparkling diamond earrings', pointsRequired: 600, category: 'jewelry', rarity: 'legendary' },
    
    // Clothing
    { id: 'scarf', name: 'Scarf', emoji: '🧣', description: 'A warm winter scarf', pointsRequired: 180, category: 'clothing', rarity: 'common' },
    { id: 'cape', name: 'Cape', emoji: '🦸‍♂️', description: 'A heroic cape', pointsRequired: 350, category: 'clothing', rarity: 'epic' },
    { id: 'tie', name: 'Tie', emoji: '👔', description: 'A professional tie', pointsRequired: 220, category: 'clothing', rarity: 'rare' },
    
    // Special
    { id: 'halo', name: 'Halo', emoji: '😇', description: 'A divine halo', pointsRequired: 1000, category: 'special', rarity: 'legendary' },
    { id: 'wings', name: 'Wings', emoji: '👼', description: 'Angelic wings', pointsRequired: 800, category: 'special', rarity: 'legendary' },
    { id: 'rainbow', name: 'Rainbow', emoji: '🌈', description: 'A magical rainbow aura', pointsRequired: 700, category: 'special', rarity: 'epic' },
  ];

  const categories = [
    { id: 'all', name: 'All', emoji: '🎭' },
    { id: 'hat', name: 'Hats', emoji: '🎩' },
    { id: 'glasses', name: 'Glasses', emoji: '🕶️' },
    { id: 'jewelry', name: 'Jewelry', emoji: '💎' },
    { id: 'clothing', name: 'Clothing', emoji: '👔' },
    { id: 'special', name: 'Special', emoji: '✨' },
  ];

  useEffect(() => {
    if (visible) {
      loadUnlockedAccessories();
    }
  }, [visible, totalPoints]);

  const loadUnlockedAccessories = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Skip Supabase queries for local users
      if (user.id === 'local-user') {
        console.log('Loading accessories for local user');
        // Unlock accessories based on points only for local users
        const pointsUnlocked = accessories
          .filter(accessory => totalPoints >= accessory.pointsRequired)
          .map(accessory => accessory.id);
        
        setUnlockedAccessories(pointsUnlocked);
        return;
      }

      // Get unlocked accessories from database
      const { data, error } = await supabase
        .from('unlockables')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', 'accessory');

      if (error) throw error;

      const unlocked = data?.map(item => item.item_id) || [];
      
      // Also unlock accessories based on points
      const pointsUnlocked = accessories
        .filter(accessory => totalPoints >= accessory.pointsRequired)
        .map(accessory => accessory.id);

      const allUnlocked = [...new Set([...unlocked, ...pointsUnlocked])];
      setUnlockedAccessories(allUnlocked);
    } catch (error) {
      console.error('Error loading unlocked accessories:', error);
    }
  };

  const unlockAccessory = async (accessoryId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const accessory = accessories.find(a => a.id === accessoryId);
      if (!accessory) return;

      // Check if user has enough points
      if (totalPoints < accessory.pointsRequired) {
        Alert.alert(
          'Not Enough Points',
          `You need ${accessory.pointsRequired} points to unlock this accessory.`
        );
        return;
      }

      // Skip Supabase queries for local users
      if (user.id === 'local-user') {
        console.log('Unlocking accessory for local user:', accessoryId);
        // Update local state only
        setUnlockedAccessories(prev => [...prev, accessoryId]);
        
        Alert.alert(
          'Accessory Unlocked!',
          `You've unlocked the ${accessory.name}!`
        );
        return;
      }

      // Add to database
      const { error } = await supabase
        .from('unlockables')
        .insert({
          user_id: user.id,
          item_type: 'accessory',
          item_id: accessoryId,
        });

      if (error) throw error;

      // Update local state
      setUnlockedAccessories(prev => [...prev, accessoryId]);
      
      Alert.alert(
        'Accessory Unlocked!',
        `You've unlocked the ${accessory.name}!`
      );
    } catch (error) {
      console.error('Error unlocking accessory:', error);
    }
  };

  const equipAccessory = (accessoryId: string) => {
    if (equippedAccessories.includes(accessoryId)) {
      // Unequip
      setEquippedAccessories(prev => prev.filter(id => id !== accessoryId));
    } else {
      // Equip (limit to 3 accessories)
      if (equippedAccessories.length >= 3) {
        Alert.alert(
          'Too Many Accessories',
          'You can only equip 3 accessories at a time.'
        );
        return;
      }
      setEquippedAccessories(prev => [...prev, accessoryId]);
    }
  };

  const getFilteredAccessories = () => {
    if (selectedCategory === 'all') {
      return accessories;
    }
    return accessories.filter(accessory => accessory.category === selectedCategory);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#95A5A6';
      case 'rare': return '#3498DB';
      case 'epic': return '#9B59B6';
      case 'legendary': return '#F39C12';
      default: return '#95A5A6';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'rgba(149, 165, 166, 0.3)';
      case 'rare': return 'rgba(52, 152, 219, 0.3)';
      case 'epic': return 'rgba(155, 89, 182, 0.3)';
      case 'legendary': return 'rgba(243, 156, 18, 0.3)';
      default: return 'rgba(149, 165, 166, 0.3)';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sheep Accessories</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          style={styles.categoryContainer}
          showsHorizontalScrollIndicator={false}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Equipped Accessories */}
        {equippedAccessories.length > 0 && (
          <View style={styles.equippedContainer}>
            <Text style={styles.equippedTitle}>Currently Equipped:</Text>
            <View style={styles.equippedList}>
              {equippedAccessories.map(accessoryId => {
                const accessory = accessories.find(a => a.id === accessoryId);
                return accessory ? (
                  <TouchableOpacity
                    key={accessoryId}
                    style={styles.equippedItem}
                    onPress={() => equipAccessory(accessoryId)}
                  >
                    <Text style={styles.equippedEmoji}>{accessory.emoji}</Text>
                  </TouchableOpacity>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Accessories Grid */}
        <ScrollView style={styles.accessoriesContainer}>
          <View style={styles.grid}>
            {getFilteredAccessories().map(accessory => {
              const isUnlocked = unlockedAccessories.includes(accessory.id);
              const isEquipped = equippedAccessories.includes(accessory.id);
              const canUnlock = totalPoints >= accessory.pointsRequired;

              return (
                <TouchableOpacity
                  key={accessory.id}
                  style={[
                    styles.accessoryCard,
                    {
                      borderColor: getRarityBorder(accessory.rarity),
                      backgroundColor: isUnlocked 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.3)',
                      opacity: isUnlocked ? 1 : 0.6,
                    },
                    isEquipped && styles.accessoryCardEquipped,
                  ]}
                  onPress={() => {
                    if (isUnlocked) {
                      equipAccessory(accessory.id);
                    } else if (canUnlock) {
                      unlockAccessory(accessory.id);
                    }
                  }}
                >
                  {/* Rarity Indicator */}
                  <View style={[
                    styles.rarityIndicator,
                    { backgroundColor: getRarityColor(accessory.rarity) }
                  ]} />

                  {/* Accessory Emoji */}
                  <Text style={styles.accessoryEmoji}>{accessory.emoji}</Text>

                  {/* Accessory Name */}
                  <Text style={styles.accessoryName}>{accessory.name}</Text>

                  {/* Accessory Description */}
                  <Text style={styles.accessoryDescription}>
                    {accessory.description}
                  </Text>

                  {/* Points Required */}
                  <Text style={styles.pointsRequired}>
                    {isUnlocked ? 'Unlocked' : `${accessory.pointsRequired} pts`}
                  </Text>

                  {/* Equipped Indicator */}
                  {isEquipped && (
                    <View style={styles.equippedIndicator}>
                      <Text style={styles.equippedText}>✓</Text>
                    </View>
                  )}

                  {/* Lock Icon */}
                  {!isUnlocked && (
                    <View style={styles.lockIndicator}>
                      <Text style={styles.lockText}>🔒</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B8A4E4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  equippedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 15,
    borderRadius: 15,
    padding: 15,
  },
  equippedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  equippedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  equippedItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 10,
    margin: 5,
    alignItems: 'center',
  },
  equippedEmoji: {
    fontSize: 24,
  },
  accessoriesContainer: {
    flex: 1,
    padding: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  accessoryCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  accessoryCardEquipped: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  rarityIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accessoryEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  accessoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  accessoryDescription: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 16,
  },
  pointsRequired: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  equippedIndicator: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equippedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lockIndicator: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockText: {
    fontSize: 12,
  },
});

export default SheepAccessories;
