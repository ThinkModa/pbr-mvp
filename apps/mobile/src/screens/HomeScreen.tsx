import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

const HomeScreen: React.FC = () => {
  const categories = [
    { id: 1, name: 'House', icon: '🏠' },
    { id: 2, name: 'Apartment', icon: '🏢' },
    { id: 3, name: 'Villa', icon: '🏡' },
    { id: 4, name: 'Condo', icon: '🏘️' },
  ];

  const featuredProperties = [
    {
      id: 1,
      title: 'Modern Downtown Apartment',
      location: 'Downtown District',
      price: '$2,500/month',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
      bedrooms: 2,
      bathrooms: 2,
    },
    {
      id: 2,
      title: 'Luxury Family House',
      location: 'Suburban Area',
      price: '$4,200/month',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
      bedrooms: 4,
      bathrooms: 3,
    },
    {
      id: 3,
      title: 'Cozy Studio Apartment',
      location: 'City Center',
      price: '$1,800/month',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
      bedrooms: 1,
      bathrooms: 1,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.userName}>Welcome to PBR</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100' }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchPlaceholder}>🔍 Search properties...</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryItem}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Properties */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propertiesScroll}>
            {featuredProperties.map((property) => (
              <TouchableOpacity key={property.id} style={styles.propertyCard}>
                <Image source={{ uri: property.image }} style={styles.propertyImage} />
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle}>{property.title}</Text>
                  <Text style={styles.propertyLocation}>{property.location}</Text>
                  <View style={styles.propertyDetails}>
                    <Text style={styles.propertyDetail}>🛏️ {property.bedrooms}</Text>
                    <Text style={styles.propertyDetail}>🚿 {property.bathrooms}</Text>
                  </View>
                  <Text style={styles.propertyPrice}>{property.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={styles.quickActionText}>My Listings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>❤️</Text>
              <Text style={styles.quickActionText}>Favorites</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>📞</Text>
              <Text style={styles.quickActionText}>Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionIcon}>⚙️</Text>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6F1',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#265451',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  filterButton: {
    backgroundColor: '#D29507',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterIcon: {
    fontSize: 18,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#265451',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#D29507',
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  propertiesScroll: {
    paddingLeft: 24,
  },
  propertyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginRight: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  propertyDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 16,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D29507',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
});

export default HomeScreen;