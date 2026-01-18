import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { AppText } from '../components/Typography';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { movieSearchService } from '../services/api';
import { HomeStackParamList } from '../navigation/AppNavigator';

type CastDetailsScreenProps = NativeStackScreenProps<HomeStackParamList, 'CastDetails'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CastDetailsScreen: React.FC<CastDetailsScreenProps> = ({ navigation, route }) => {
  const { personId, personName } = route.params;
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonDetails();
  }, [personId]);

  const loadPersonDetails = async () => {
    try {
      setLoading(true);
      const details = await movieSearchService.getPersonDetails(personId);
      setPerson(details);
    } catch (error) {
      console.error('Error loading person details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-outline" size={64} color="#666" />
        <AppText style={styles.errorText}>Person not found</AppText>
      </View>
    );
  }

  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { top: statusBarHeight + 10 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: statusBarHeight + 20 }}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {person.profilePath ? (
            <Image
              source={{ uri: person.profilePath }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={80} color="#666" />
            </View>
          )}
          
          <View style={styles.heroInfo}>
            <AppText style={styles.name}>{person.name || personName}</AppText>
            
            {person.knownForDepartment && (
              <View style={styles.departmentBadge}>
                <Ionicons name="film-outline" size={16} color="#007AFF" />
                <AppText style={styles.departmentText}>{person.knownForDepartment}</AppText>
              </View>
            )}
          </View>
        </View>

      <View style={styles.content}>
        {/* Biography */}
        {person.biography && (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Biography</AppText>
            <AppText style={styles.biographyText}>{person.biography}</AppText>
          </View>
        )}

        {/* Personal Info */}
        <View style={styles.infoSection}>
          {person.birthday && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <View style={styles.infoContent}>
                <AppText style={styles.infoLabel}>Birthday</AppText>
                <AppText style={styles.infoValue}>{formatDate(person.birthday)}</AppText>
              </View>
            </View>
          )}

          {person.placeOfBirth && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#007AFF" />
              <View style={styles.infoContent}>
                <AppText style={styles.infoLabel}>Place of Birth</AppText>
                <AppText style={styles.infoValue}>{person.placeOfBirth}</AppText>
              </View>
            </View>
          )}
        </View>

        {/* Known For Movies */}
        {person.movies && person.movies.length > 0 && (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Known For</AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moviesContainer}
            >
              {person.movies.map((movie: any) => (
                <TouchableOpacity
                  key={movie.id}
                  style={styles.movieCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    navigation.navigate('MovieDetails', {
                      movie: {
                        tmdbId: movie.id,
                        title: movie.title,
                        posterUrl: movie.posterPath,
                        releaseDate: movie.releaseDate,
                      },
                    });
                  }}
                >
                  {movie.posterPath ? (
                    <Image
                      source={{ uri: movie.posterPath }}
                      style={styles.moviePoster}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.moviePosterPlaceholder}>
                      <Ionicons name="film-outline" size={32} color="#666" />
                    </View>
                  )}
                  <AppText style={styles.movieTitle} numberOfLines={2}>
                    {movie.title}
                  </AppText>
                  {movie.character && (
                    <AppText style={styles.movieCharacter} numberOfLines={1}>
                      as {movie.character}
                    </AppText>
                  )}
                  {movie.releaseDate && (
                    <AppText style={styles.movieYear}>
                      {new Date(movie.releaseDate).getFullYear()}
                    </AppText>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Photo Gallery */}
        {person.images && person.images.length > 0 && (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Photos</AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosContainer}
            >
              {person.images.map((img: any, index: number) => (
                <Image
                  key={index}
                  source={{ uri: img.path }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#999',
    fontSize: 16,
    marginTop: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
    backgroundColor: '#2a2a2a',
  },
  profilePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  departmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  departmentText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  biographyText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
  },
  infoSection: {
    marginBottom: 32,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  moviesContainer: {
    paddingRight: 20,
  },
  movieCard: {
    width: 140,
    marginRight: 16,
  },
  moviePoster: {
    width: 140,
    height: 210,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    marginBottom: 12,
    // Glow effect for border
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  moviePosterPlaceholder: {
    width: 140,
    height: 210,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  movieTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
    color: '#fff',
    lineHeight: 14,
  },
  movieCharacter: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  movieYear: {
    fontSize: 12,
    color: '#666',
  },
  photosContainer: {
    paddingRight: 20,
  },
  photo: {
    width: 200,
    height: 300,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#2a2a2a',
  },
});

export default CastDetailsScreen;
