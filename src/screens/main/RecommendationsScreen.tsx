import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
    getFashionRecommendations,
    getGarmentById,
    OutfitRecommendation,
} from '../../services/fashionRecommendations';
import { Garment } from '../../services/supabaseService';

// Mock data
const MOCK_WEATHER = {
    temp: 23,
    condition: 'Soleado',
    icon: 'wb-sunny',
};

const QUICK_SUGGESTIONS = [
    { id: '1', emoji: '☀️', text: 'Look para hoy', action: 'today' },
    { id: '2', emoji: '🎉', text: 'Salida nocturna', action: 'night' },
    { id: '3', emoji: '💼', text: 'Trabajo', action: 'work' },
    { id: '4', emoji: '🏃', text: 'Gym', action: 'gym' },
];

export default function RecommendationsScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 20) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const loadRecommendations = async (occasion?: string) => {
        if (!user) return;

        try {
            setLoading(true);
            const recs = await getFashionRecommendations(user.id, 3, occasion);
            setRecommendations(recs);
            setHasGenerated(true);
        } catch (error) {
            console.error('Error loading recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChatWithAssistant = () => {
        navigation.navigate('FashionAgent' as never);
    };

    const handleLookPress = (recommendation: OutfitRecommendation) => {
        // Navigate to Wardrobe screen with pre-selected garments
        navigation.navigate('Wardrobe' as never, {
            preselectedGarments: recommendation.garments,
            autoGenerate: true,
        } as never);
    };

    const handleQuickSuggestion = (action: string) => {
        setSelectedSuggestion(action);
        // Load recommendations with the selected occasion
        loadRecommendations(action);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section - Greeting & Weather */}
                <View style={styles.heroSection}>
                    <View style={styles.greetingContainer}>
                        <Text style={styles.greeting}>{getGreeting()}! 👋</Text>
                        <Text style={styles.userName}>Lucas</Text>
                    </View>

                    {/* Weather Card */}
                    <View style={styles.weatherCard}>
                        <View style={styles.weatherLeft}>
                            <MaterialIcons name={MOCK_WEATHER.icon as any} size={40} color="#FFB800" />
                            <View style={styles.weatherInfo}>
                                <Text style={styles.weatherTemp}>{MOCK_WEATHER.temp}°</Text>
                                <Text style={styles.weatherCondition}>{MOCK_WEATHER.condition}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.weatherAction}
                            onPress={handleChatWithAssistant}
                        >
                            <Text style={styles.weatherActionText}>Charlar con IA</Text>
                            <MaterialIcons name="chat" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Suggestions */}
                <View style={styles.suggestionsSection}>
                    <Text style={styles.sectionTitle}>¿Qué estás buscando?</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.suggestionsScroll}
                    >
                        {QUICK_SUGGESTIONS.map((suggestion) => (
                            <TouchableOpacity
                                key={suggestion.id}
                                style={[
                                    styles.suggestionChip,
                                    selectedSuggestion === suggestion.action && styles.suggestionChipActive,
                                ]}
                                onPress={() => handleQuickSuggestion(suggestion.action)}
                            >
                                <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
                                <Text style={[
                                    styles.suggestionText,
                                    selectedSuggestion === suggestion.action && styles.suggestionTextActive,
                                ]}>
                                    {suggestion.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Looks Section */}
                <View style={styles.looksSection}>
                    <View style={styles.looksSectionHeader}>
                        <Text style={styles.sectionTitle}>Looks Recomendados</Text>
                        {hasGenerated && (
                            <TouchableOpacity
                                style={styles.seeAllButton}
                                onPress={() => loadRecommendations(selectedSuggestion || undefined)}
                            >
                                <MaterialIcons name="refresh" size={18} color="#666" />
                                <Text style={styles.seeAllText}>Regenerar</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading ? (
                        <View style={styles.loadingLooksContainer}>
                            <ActivityIndicator size="large" color="#000" />
                            <Text style={styles.loadingLooksText}>Analizando tu guardarropa...</Text>
                        </View>
                    ) : !hasGenerated ? (
                        <View style={styles.emptyLooksContainer}>
                            <MaterialIcons name="auto-awesome" size={48} color="#CCC" />
                            <Text style={styles.emptyLooksTitle}>¿Listo para verte increíble?</Text>
                            <Text style={styles.emptyLooksText}>
                                Seleccioná una sugerencia arriba o chateá con tu asistente
                            </Text>
                        </View>
                    ) : recommendations.length === 0 ? (
                        <View style={styles.emptyLooksContainer}>
                            <MaterialIcons name="checkroom" size={48} color="#CCC" />
                            <Text style={styles.emptyLooksTitle}>Necesitás más prendas</Text>
                            <Text style={styles.emptyLooksText}>
                                Agregá al menos una prenda de cada tipo para recibir recomendaciones
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyLooksButton}
                                onPress={() => navigation.navigate('Closet' as never)}
                            >
                                <MaterialIcons name="add" size={20} color="#FFF" />
                                <Text style={styles.emptyLooksButtonText}>Agregar Prendas</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        recommendations.map((rec) => (
                            <AILookCard
                                key={rec.id}
                                recommendation={rec}
                                onPress={() => handleLookPress(rec)}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

interface AILookCardProps {
    recommendation: OutfitRecommendation;
    onPress: () => void;
}

function AILookCard({ recommendation, onPress }: AILookCardProps) {
    const [upperGarment, setUpperGarment] = useState<Garment | null>(null);
    const [lowerGarment, setLowerGarment] = useState<Garment | null>(null);
    const [footwearGarment, setFootwearGarment] = useState<Garment | null>(null);
    const [loadingImages, setLoadingImages] = useState(true);

    useEffect(() => {
        loadGarmentImages();
    }, []);

    const loadGarmentImages = async () => {
        try {
            const [upper, lower, footwear] = await Promise.all([
                getGarmentById(recommendation.garments.upperId),
                getGarmentById(recommendation.garments.lowerId),
                getGarmentById(recommendation.garments.footwearId),
            ]);

            setUpperGarment(upper);
            setLowerGarment(lower);
            setFootwearGarment(footwear);
        } catch (error) {
            console.error('Error loading garment images:', error);
        } finally {
            setLoadingImages(false);
        }
    };

    if (loadingImages) {
        return (
            <View style={[styles.lookCard, styles.lookCardLoading]}>
                <ActivityIndicator size="small" color="#000" />
            </View>
        );
    }

    return (
        <TouchableOpacity style={styles.lookCard} onPress={onPress} activeOpacity={0.9}>
            {/* Images Row */}
            <View style={styles.lookImagesContainer}>
                {upperGarment && (
                    <View style={styles.lookImageWrapper}>
                        <Image
                            source={{ uri: upperGarment.image_url }}
                            style={styles.lookImage}
                            resizeMode="cover"
                        />
                    </View>
                )}
                {lowerGarment && (
                    <View style={styles.lookImageWrapper}>
                        <Image
                            source={{ uri: lowerGarment.image_url }}
                            style={styles.lookImage}
                            resizeMode="cover"
                        />
                    </View>
                )}
                {footwearGarment && (
                    <View style={styles.lookImageWrapper}>
                        <Image
                            source={{ uri: footwearGarment.image_url }}
                            style={styles.lookImage}
                            resizeMode="cover"
                        />
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.lookInfo}>
                <View style={styles.lookHeader}>
                    <Text style={styles.lookName}>{recommendation.name}</Text>
                    <View style={styles.lookScoreBadge}>
                        <MaterialIcons name="star" size={14} color="#FFD700" />
                        <Text style={styles.lookScore}>{recommendation.score}/10</Text>
                    </View>
                </View>
                <Text style={styles.lookDescription}>{recommendation.description}</Text>

                {/* Reasoning */}
                {recommendation.reasoning && (
                    <View style={styles.reasoningBox}>
                        <MaterialIcons name="lightbulb-outline" size={16} color="#666" />
                        <Text style={styles.reasoningText}>{recommendation.reasoning}</Text>
                    </View>
                )}

                <View style={styles.lookFooter}>
                    <View style={styles.lookTags}>
                        <View style={styles.lookTag}>
                            <Text style={styles.lookTagText}>{recommendation.occasion}</Text>
                        </View>
                        {recommendation.season && (
                            <View style={styles.lookTag}>
                                <Text style={styles.lookTagText}>{recommendation.season}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity style={styles.tryButton} onPress={onPress}>
                        <Text style={styles.tryButtonText}>Probar</Text>
                        <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    heroSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    greetingContainer: {
        marginBottom: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    userName: {
        fontSize: 18,
        color: '#666',
        fontWeight: '500',
    },
    weatherCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    weatherLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    weatherInfo: {
        gap: 2,
    },
    weatherTemp: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    weatherCondition: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    weatherAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    weatherActionText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFF',
    },
    suggestionsSection: {
        marginTop: 24,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    suggestionsScroll: {
        paddingHorizontal: 20,
        gap: 8,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
    },
    suggestionChipActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    suggestionEmoji: {
        fontSize: 18,
    },
    suggestionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    suggestionTextActive: {
        color: '#FFF',
    },
    looksSection: {
        marginTop: 24,
    },
    looksSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 4,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    loadingLooksContainer: {
        paddingVertical: 48,
        alignItems: 'center',
        gap: 12,
    },
    loadingLooksText: {
        fontSize: 14,
        color: '#666',
    },
    emptyLooksContainer: {
        paddingVertical: 48,
        paddingHorizontal: 32,
        alignItems: 'center',
        marginHorizontal: 20,
    },
    emptyLooksTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyLooksText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    emptyLooksButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#000',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 20,
    },
    emptyLooksButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    lookCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    lookCardLoading: {
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lookImagesContainer: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: 12,
        gap: 8,
    },
    lookImageWrapper: {
        flex: 1,
        aspectRatio: 3 / 4,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
    },
    lookImage: {
        width: '100%',
        height: '100%',
    },
    lookInfo: {
        padding: 16,
    },
    lookHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    lookName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    lookScoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    lookScore: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    lookDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    reasoningBox: {
        flexDirection: 'row',
        gap: 8,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 12,
    },
    reasoningText: {
        flex: 1,
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    lookFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lookTags: {
        flexDirection: 'row',
        gap: 8,
    },
    lookTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
    },
    lookTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    tryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    tryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    ctaCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 24,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    ctaTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 12,
        marginBottom: 4,
        textAlign: 'center',
    },
    ctaSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#000',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    ctaButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
});
