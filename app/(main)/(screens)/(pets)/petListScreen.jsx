// app/(main)/(screens)/petListScreen.jsx
import React, { useState } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, RefreshControl } from 'react-native';
import { Avatar, ActivityIndicator, FAB, Searchbar, IconButton, Chip } from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivityIndicatorColors, useFabColors } from '@/hooks/useThemeColor';
import { BrandColors } from '@/constants/Colors';
import { router } from 'expo-router';
import { usePets } from '@/hooks/usePetsData';

export default function PetListScreen() {
  const { colors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const fabColors = useFabColors();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { pets, loading, error, refetch } = usePets();
  
  const handleAddPet = () => {
    router.push("/addPetScreen");
  };
  
  const handlePetPress = (petId) => {
    router.push({
      pathname: '/petProfileScreen',
      params: { petId }
    });
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing pets:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const getFilteredPets = () => {
    if (!searchQuery) return pets;
    return pets.filter(pet => 
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      pet.species.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const renderPetCard = ({ item }) => {
    return (
      <TouchableOpacity 
        onPress={() => handlePetPress(item.id)}
        activeOpacity={0.7}
        style={styles.cardTouchable}
      >
        <ThemedCard variant="elevated" style={styles.petCard}>
          <View style={styles.cardContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {item.image_url ? (
                <Avatar.Image 
                  size={56} 
                  source={{ uri: item.image_url }}
                />
              ) : (
                <Avatar.Icon 
                  size={56} 
                  icon="account-circle"
                  style={{ backgroundColor: colors.surface }}
                  color={colors.textSecondary}
                />
              )}
            </View>
            
            {/* Pet Info */}
            <View style={styles.petInfo}>
              <ThemedText style={styles.petName}>{item.name}</ThemedText>
              <ThemedText style={[styles.petSpecies, { color: colors.textSecondary }]}>
                {item.species}
              </ThemedText>
              
              {/* Compact details row */}
              <View style={styles.detailsRow}>
                {item.age && (
                  <Chip 
                    compact
                    style={[styles.detailChip, { backgroundColor: colors.surface }]}
                    textStyle={[styles.chipText, { color: colors.textSecondary }]}
                  >
                    {item.age}
                  </Chip>
                )}
                
                {item.pet_type && (
                  <Chip 
                    compact
                    style={[
                      styles.typeChip, 
                      { backgroundColor: BrandColors.primary + '10' }
                    ]}
                    textStyle={[styles.chipText, { color: BrandColors.primary }]}
                  >
                    {item.pet_type}
                  </Chip>
                )}
              </View>
            </View>
            
            {/* Navigation indicator */}
            <IconButton
              icon="chevron-right"
              size={20}
              iconColor={colors.textSecondary}
              style={styles.navIcon}
            />
          </View>
        </ThemedCard>
      </TouchableOpacity>
    );
  };
  
  const renderSearchHeader = () => (
    <View style={styles.searchContainer}>
      <Searchbar
        placeholder="Search pets"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: colors.surface }]}
        inputStyle={{ 
          color: colors.text,
          textAlignVertical: 'center',
          includeFontPadding: false, // Remove Android font padding
          paddingTop: 0, // Remove any top padding
          paddingBottom: 12, // Slight bottom padding to push text up
          marginTop: 0, // Move text up slightly
        }}
        iconColor={colors.textSecondary}
        placeholderTextColor={colors.textSecondary}
        elevation={0}
      />
      
      <IconButton
        icon="refresh"
        size={22}
        onPress={handleRefresh}
        disabled={isRefreshing || loading}
        style={[styles.refreshButton, { backgroundColor: colors.surface }]}
        iconColor={colors.text}
      />
    </View>
  );
  
  if (error) {
    return (
      <ThemedView style={styles.container}>
        {renderSearchHeader()}
        <View style={styles.centerState}>
          <IconButton
            icon="alert-circle"
            size={40}
            iconColor={colors.error}
          />
          <ThemedText style={styles.stateTitle}>Connection Error</ThemedText>
          <ThemedText style={[styles.stateMessage, { color: colors.textSecondary }]}>
            {error}
          </ThemedText>
          <IconButton
            icon="refresh"
            size={28}
            onPress={handleRefresh}
            disabled={isRefreshing}
            style={[styles.stateAction, { backgroundColor: colors.surface }]}
            iconColor={colors.text}
          />
        </View>
      </ThemedView>
    );
  }
  
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        {renderSearchHeader()}
        <View style={styles.centerState}>
          <ActivityIndicator 
            size="large" 
            color={activityIndicatorColors.primary}
          />
          <ThemedText style={[styles.stateMessage, { color: colors.textSecondary }]}>
            Loading pets...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }
  
  if (pets.length === 0) {
    return (
      <ThemedView style={styles.container}>
        {renderSearchHeader()}
        <View style={styles.centerState}>
          <IconButton
            icon="plus-circle-outline"
            size={48}
            iconColor={colors.textSecondary}
          />
          <ThemedText style={styles.stateTitle}>No pets yet</ThemedText>
          <ThemedText style={[styles.stateMessage, { color: colors.textSecondary }]}>
            Add your first pet to get started
          </ThemedText>
        </View>
        
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: fabColors.background }]}
          color={fabColors.text}
          onPress={handleAddPet}
        />
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={getFilteredPets()}
        renderItem={renderPetCard}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderSearchHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[BrandColors.primary]}
            tintColor={BrandColors.primary}
            progressBackgroundColor={colors.surface}
          />
        }
      />
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: fabColors.background }]}
        color={fabColors.text}
        onPress={handleAddPet}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 1, // Match card padding exactly
    paddingTop: 20,
    paddingBottom: 40, // Reduced to tighten spacing
    gap: 8,
  },
  searchBar: {
    flex: 1,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    padding: 0,
  },
  refreshButton: {
    borderRadius: 8,
    width: 44,
    height: 44,
    margin: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 88,
  },
  cardTouchable: {
    marginBottom: 12,
  },
  petCard: {
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, // This should now align with search
    paddingVertical: 14,
  },
  avatarContainer: {
    marginRight: 12,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  petSpecies: {
    fontSize: 14,
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginLeft: -10, // Ensure chips align properly
  },
  detailChip: {
    height: 24,
    justifyContent: 'center', // Center chip content
  },
  typeChip: {
    height: 24,
    justifyContent: 'center', // Center chip content
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14, // Explicit line height for better centering
    textAlignVertical: 'center', // Android-specific vertical centering
  },
  navIcon: {
    margin: 0,
    width: 32,
    height: 32,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  stateMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  stateAction: {
    borderRadius: 8,
    width: 44,
    height: 44,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});