import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { saveProcessedGarment } from '../../services/supabaseService';
import CustomAlert from '../../components/CustomAlert';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

type GarmentCategory = 'upper' | 'lower' | 'footwear' | 'one-piece';

interface RouteParams {
    imageBase64: string;
    category: GarmentCategory;
    type: string;
    description: string;
    metadata?: any;
    aiAnalysis?: any;
}

export default function EditGarmentScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const params = route.params as RouteParams;

    const [selectedCategory, setSelectedCategory] = useState<GarmentCategory>(params.category);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ title, message });
        setAlertVisible(true);
    };

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);

        try {
            const { data, error } = await saveProcessedGarment(
                user.id,
                selectedCategory,
                params.type,
                params.description,
                params.imageBase64,
                params.metadata,
                params.aiAnalysis
            );

            if (error) {
                showAlert('Error', 'No se pudo guardar la prenda');
                return;
            }

            // Show success screen
            setShowSuccess(true);
        } catch (error) {
            console.error('Error saving garment:', error);
            showAlert('Error', 'Ocurrió un error al guardar la prenda');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoToCollection = () => {
        // Navigate back to main tabs and focus on Closet tab
        navigation.reset({
            index: 0,
            routes: [
                {
                    name: 'MainTabs' as never,
                    state: {
                        routes: [
                            { name: 'Home' },
                            { name: 'Looks' },
                            { name: 'Wardrobe' },
                            { name: 'Closet' },
                        ],
                        index: 3, // Closet is the 4th tab (index 3)
                    },
                },
            ],
        });
    };

    // Category options
    const categories = [
        { value: 'upper' as GarmentCategory, label: 'Parte Superior', icon: 'checkroom' },
        { value: 'lower' as GarmentCategory, label: 'Parte Inferior', icon: 'checkroom' },
        { value: 'footwear' as GarmentCategory, label: 'Calzado', icon: 'directions-walk' },
        { value: 'one-piece' as GarmentCategory, label: 'Cuerpo Completo', icon: 'accessibility-new' },
    ];

    if (showSuccess) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.successContainer}>
                    <View style={styles.successContent}>
                        <View style={styles.successIconContainer}>
                            <MaterialIcons name="check-circle" size={80} color="#000000" />
                        </View>
                        <Text style={styles.successTitle}>¡Prenda Guardada!</Text>
                        <Text style={styles.successMessage}>
                            Tu prenda ha sido agregada a tu colección
                        </Text>

                        <TouchableOpacity
                            style={styles.successButton}
                            onPress={handleGoToCollection}
                        >
                            <Text style={styles.successButtonText}>Ver Colección</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar y Categorizar</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Preview Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: `data:image/jpeg;base64,${params.imageBase64}` }}
                        style={styles.garmentImage}
                        resizeMode="contain"
                    />
                </View>

                {/* AI Analysis Section */}
                {params.metadata && (
                    <View style={styles.analysisSection}>
                        <Text style={styles.sectionTitle}>Análisis IA</Text>
                        <View style={styles.analysisContainer}>
                            {params.metadata.primaryColor && (
                                <View style={styles.analysisRow}>
                                    <MaterialIcons name="palette" size={18} color="#666" />
                                    <Text style={styles.analysisLabel}>Color:</Text>
                                    <Text style={styles.analysisValue}>{params.metadata.primaryColor}</Text>
                                </View>
                            )}
                            {params.metadata.style && (
                                <View style={styles.analysisRow}>
                                    <MaterialIcons name="style" size={18} color="#666" />
                                    <Text style={styles.analysisLabel}>Estilo:</Text>
                                    <Text style={styles.analysisValue}>{params.metadata.style}</Text>
                                </View>
                            )}
                            {params.metadata.occasion && params.metadata.occasion.length > 0 && (
                                <View style={styles.analysisRow}>
                                    <MaterialIcons name="event" size={18} color="#666" />
                                    <Text style={styles.analysisLabel}>Ocasión:</Text>
                                    <Text style={styles.analysisValue}>
                                        {Array.isArray(params.metadata.occasion)
                                            ? params.metadata.occasion.join(', ')
                                            : params.metadata.occasion}
                                    </Text>
                                </View>
                            )}
                            {params.metadata.versatility && (
                                <View style={styles.analysisRow}>
                                    <MaterialIcons name="stars" size={18} color="#666" />
                                    <Text style={styles.analysisLabel}>Versatilidad:</Text>
                                    <Text style={styles.analysisValue}>{params.metadata.versatility}/10</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Categories Section */}
                <View style={styles.categoriesSection}>
                    <Text style={styles.sectionTitle}>Categorías</Text>
                    <View style={styles.categoriesContainer}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.value}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === cat.value && styles.categoryChipActive,
                                ]}
                                onPress={() => setSelectedCategory(cat.value)}
                            >
                                <Text
                                    style={[
                                        styles.categoryChipText,
                                        selectedCategory === cat.value && styles.categoryChipTextActive,
                                    ]}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Guardar</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
        marginBottom: 24,
    },
    garmentImage: {
        width: '100%',
        height: '100%',
    },
    analysisSection: {
        marginBottom: 24,
    },
    analysisContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 16,
        gap: 12,
    },
    analysisRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    analysisLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
        marginLeft: 4,
    },
    analysisValue: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '500',
        flex: 1,
    },
    categoriesSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    categoryChipActive: {
        backgroundColor: '#000000',
        borderColor: '#000000',
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
    },
    categoryChipTextActive: {
        color: '#FFFFFF',
    },
    bottomBar: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    saveButton: {
        height: 48,
        backgroundColor: '#000000',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    successContent: {
        alignItems: 'center',
        width: '100%',
    },
    successIconContainer: {
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 32,
    },
    successButton: {
        width: '100%',
        height: 48,
        backgroundColor: '#000000',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
