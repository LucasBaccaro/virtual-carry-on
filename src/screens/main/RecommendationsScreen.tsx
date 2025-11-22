import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StatusBar,
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
import PageHeader from '../../components/PageHeader';
import CustomAlert from '../../components/CustomAlert';

export default function RecommendationsScreen() {
    const { user } = useAuth();
    const navigation = useNavigation();

    const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

    // Get current date formatted
    const currentDate = new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
    });

    const loadRecommendations = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const recs = await getFashionRecommendations(user.id, 3);
            setRecommendations(recs);
            setHasGenerated(true);
        } catch (error) {
            console.error('Error loading recommendations:', error);
            showAlert('Error', 'No se pudieron cargar las recomendaciones');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ title, message });
        setAlertVisible(true);
    };

    const handleAcceptLook = (recommendation: OutfitRecommendation) => {
        // Navigate to Wardrobe screen with pre-selected garments
        navigation.navigate('Wardrobe', {
            preselectedGarments: recommendation.garments,
            autoGenerate: true,
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <PageHeader title="Recomendaciones" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loadingText}>Analizando tu guardarropa...</Text>
                    <Text style={styles.loadingSubtext}>
                        Un diseñador de moda está creando looks perfectos para vos
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!hasGenerated) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <PageHeader title="Recomendaciones" />
                <View style={styles.welcomeContainer}>
                    <View style={styles.welcomeIconContainer}>
                        <MaterialIcons name="lightbulb" size={48} color="#000" />
                    </View>
                    <Text style={styles.welcomeTitle}>Looks del Día</Text>
                    <Text style={styles.welcomeDate}>{currentDate}</Text>
                    <Text style={styles.welcomeText}>
                        Tengo algunas recomendaciones de outfits para hoy basadas en tu guardarropa.
                    </Text>

                    <TouchableOpacity
                        style={styles.generateButton}
                        onPress={loadRecommendations}
                    >
                        <Text style={styles.generateButtonText}>Generar Looks</Text>
                        <MaterialIcons name="auto-awesome" size={20} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.personalizeLink}
                        onPress={() => navigation.navigate('FashionAgent')}
                    >
                        <Text style={styles.personalizeLinkText}>O personalizá tu búsqueda</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (recommendations.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <PageHeader title="Recomendaciones" />
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="checkroom" size={80} color="#CCC" />
                    <Text style={styles.emptyTitle}>No hay suficientes prendas</Text>
                    <Text style={styles.emptyText}>
                        Necesitás al menos una prenda de cada tipo (superior, inferior, calzado) para recibir recomendaciones
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => navigation.navigate('Closet')}
                    >
                        <MaterialIcons name="add" size={24} color="#FFFFFF" />
                        <Text style={styles.emptyButtonText}>Agregar Prendas</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <PageHeader title="Recomendaciones" />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.subtitle}>
                        Un diseñador de moda analizó tu guardarropa y creó estos looks para vos
                    </Text>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={loadRecommendations}
                        >
                            <MaterialIcons name="refresh" size={20} color="#000" />
                            <Text style={styles.actionButtonText}>Regenerar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.primaryAction]}
                            onPress={() => navigation.navigate('FashionAgent')}
                        >
                            <MaterialIcons name="chat" size={20} color="#FFF" />
                            <Text style={styles.primaryActionText}>Personalizar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {recommendations.map((rec, index) => (
                    <OutfitRecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        index={index + 1}
                        onAccept={() => handleAcceptLook(rec)}
                    />
                ))}
            </ScrollView>

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

interface OutfitCardProps {
    recommendation: OutfitRecommendation;
    index: number;
    onAccept: () => void;
}

function OutfitRecommendationCard({ recommendation, index, onAccept }: OutfitCardProps) {
    const [upperGarment, setUpperGarment] = useState<Garment | null>(null);
    const [lowerGarment, setLowerGarment] = useState<Garment | null>(null);
    const [footwearGarment, setFootwearGarment] = useState<Garment | null>(null);
    const [loading, setLoading] = useState(true);

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
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.card}>
                <ActivityIndicator size="small" color="#000" />
            </View>
        );
    }

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.lookNumber}>Look #{index}</Text>
                <View style={styles.scoreBadge}>
                    <MaterialIcons name="star" size={16} color="#FFD700" />
                    <Text style={styles.score}>{recommendation.score}/10</Text>
                </View>
            </View>

            {/* Look Name and Description */}
            <Text style={styles.lookName}>{recommendation.name}</Text>
            <Text style={styles.description}>{recommendation.description}</Text>

            {/* Garment Grid - 3 images */}
            <View style={styles.garmentGrid}>
                <View style={styles.garmentItem}>
                    {upperGarment && (
                        <>
                            <Image
                                source={{ uri: upperGarment.image_url }}
                                style={styles.garmentImage}
                                resizeMode="cover"
                            />
                            <Text style={styles.garmentLabel}>{upperGarment.type}</Text>
                        </>
                    )}
                </View>

                <View style={styles.garmentItem}>
                    {lowerGarment && (
                        <>
                            <Image
                                source={{ uri: lowerGarment.image_url }}
                                style={styles.garmentImage}
                                resizeMode="cover"
                            />
                            <Text style={styles.garmentLabel}>{lowerGarment.type}</Text>
                        </>
                    )}
                </View>

                <View style={styles.garmentItem}>
                    {footwearGarment && (
                        <>
                            <Image
                                source={{ uri: footwearGarment.image_url }}
                                style={styles.garmentImage}
                                resizeMode="cover"
                            />
                            <Text style={styles.garmentLabel}>{footwearGarment.type}</Text>
                        </>
                    )}
                </View>
            </View>

            {/* Designer Reasoning */}
            <View style={styles.reasoningBox}>
                <MaterialIcons name="lightbulb-outline" size={20} color="#666" />
                <Text style={styles.reasoning}>{recommendation.reasoning}</Text>
            </View>

            {/* Tags */}
            <View style={styles.tags}>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>{recommendation.occasion}</Text>
                </View>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>{recommendation.season}</Text>
                </View>
            </View>

            {/* Try Button */}
            <TouchableOpacity style={styles.tryButton} onPress={onAccept}>
                <Text style={styles.tryButtonText}>Probar este Look</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    loadingSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 24,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#000',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    welcomeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 80,
    },
    welcomeIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    welcomeDate: {
        fontSize: 18,
        color: '#666',
        fontWeight: '500',
        marginBottom: 16,
        textTransform: 'capitalize',
    },
    welcomeText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#000',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 24,
    },
    generateButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    personalizeLink: {
        padding: 8,
    },
    personalizeLinkText: {
        fontSize: 14,
        color: '#666',
        textDecorationLine: 'underline',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
        marginBottom: 16,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    primaryAction: {
        backgroundColor: '#000',
        borderWidth: 0,
    },
    primaryActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    lookNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        letterSpacing: 0.5,
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    score: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    lookName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    garmentGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    garmentItem: {
        flex: 1,
        alignItems: 'center',
    },
    garmentImage: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    garmentLabel: {
        marginTop: 6,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    reasoningBox: {
        flexDirection: 'row',
        gap: 8,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 12,
    },
    reasoning: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    tags: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        textTransform: 'capitalize',
    },
    tryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#000',
        paddingVertical: 14,
        borderRadius: 8,
    },
    tryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
