import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, Modal } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { useOutfits } from '../../context/OutfitContext';
import { useUserPhoto } from '../../context/UserPhotoContext';
import { useAuth } from '../../context/AuthContext';
import { getGarments, Garment } from '../../services/supabaseService';
import CustomAlert from '../../components/CustomAlert';
import PageHeader from '../../components/PageHeader';
import { generateTryOnImage } from '../../services/gemini';

export default function WardrobeScreen({ route }: any) {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { saveOutfit, categories } = useOutfits();
    const { userPhotoUri, reloadUserPhoto } = useUserPhoto();

    // Get pre-selected garments from route params (from recommendations)
    const { preselectedGarments, autoGenerate } = route?.params || {};

    // Garments from Supabase
    const [upperGarments, setUpperGarments] = useState<Garment[]>([]);
    const [lowerGarments, setLowerGarments] = useState<Garment[]>([]);
    const [footwearGarments, setFootwearGarments] = useState<Garment[]>([]);
    const [onePieceGarments, setOnePieceGarments] = useState<Garment[]>([]);
    const [isLoadingGarments, setIsLoadingGarments] = useState(true);

    // Selection state
    const [selectedUpper, setSelectedUpper] = useState<string | null>(null);
    const [selectedLower, setSelectedLower] = useState<string | null>(null);
    const [selectedFootwear, setSelectedFootwear] = useState<string | null>(null);
    const [selectedOnePiece, setSelectedOnePiece] = useState<string | null>(null);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStep, setLoadingStep] = useState<string>(''); // 'analyzing', 'lighting', 'generating'
    const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [isComparing, setIsComparing] = useState(false);

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ title, message });
        setAlertVisible(true);
    };

    // Load garments and user photo from Supabase on mount and when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            loadGarments();
            reloadUserPhoto();
        }, [user])
    );

    // Handle pre-selected garments from recommendations
    // Auto-generation trigger state
    const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);

    // Handle pre-selected garments from recommendations
    useEffect(() => {
        if (preselectedGarments && !isLoadingGarments) {
            console.log('🎯 [WardrobeScreen] Pre-selecting garments from recommendation');
            setSelectedUpper(preselectedGarments.upperId || null);
            setSelectedLower(preselectedGarments.lowerId || null);
            setSelectedFootwear(preselectedGarments.footwearId || null);

            // Trigger auto-generate if requested
            if (autoGenerate) {
                console.log('⚡ [WardrobeScreen] Auto-generating try-on requested');
                setShouldAutoGenerate(true);
            }

            // Clear route params after using them to prevent re-triggering
            navigation.setParams({ preselectedGarments: undefined, autoGenerate: undefined });
        }
    }, [preselectedGarments, isLoadingGarments]);

    // Execute auto-generation once state is updated
    useEffect(() => {
        if (shouldAutoGenerate) {
            const hasSelection = selectedUpper || selectedLower || selectedFootwear || selectedOnePiece;
            if (hasSelection) {
                console.log('⚡ [WardrobeScreen] Executing auto-generation');
                handleTryOn();
                setShouldAutoGenerate(false);
            }
        }
    }, [shouldAutoGenerate, selectedUpper, selectedLower, selectedFootwear, selectedOnePiece]);

    const loadGarments = async () => {
        if (!user) return;

        console.log('🔄 [WardrobeScreen] Recargando prendas...');

        try {
            setIsLoadingGarments(true);
            const [upperResult, lowerResult, footwearResult, onePieceResult] = await Promise.all([
                getGarments(user.id, 'upper'),
                getGarments(user.id, 'lower'),
                getGarments(user.id, 'footwear'),
                getGarments(user.id, 'one-piece'),
            ]);

            if (upperResult.data) {
                console.log(`✅ [WardrobeScreen] Parte superior: ${upperResult.data.length} prendas`);
                // Verificar IDs únicos
                const uniqueIds = new Set(upperResult.data.map(g => g.id));
                if (uniqueIds.size !== upperResult.data.length) {
                    console.warn('⚠️ [WardrobeScreen] IDs duplicados detectados en parte superior');
                }
                setUpperGarments(upperResult.data || []);
            } else {
                setUpperGarments([]);
            }
            if (lowerResult.data) {
                console.log(`✅ [WardrobeScreen] Parte inferior: ${lowerResult.data.length} prendas`);
                setLowerGarments(lowerResult.data || []);
            } else {
                setLowerGarments([]);
            }
            if (footwearResult.data) {
                console.log(`✅ [WardrobeScreen] Calzado: ${footwearResult.data.length} prendas`);
                setFootwearGarments(footwearResult.data || []);
            } else {
                setFootwearGarments([]);
            }
            if (onePieceResult.data) {
                console.log(`✅ [WardrobeScreen] Cuerpo Completo: ${onePieceResult.data.length} prendas`);
                setOnePieceGarments(onePieceResult.data || []);
            } else {
                setOnePieceGarments([]);
            }
        } catch (error) {
            console.error('❌ [WardrobeScreen] Error loading garments:', error);
            showAlert('Error', 'No se pudieron cargar las prendas');
        } finally {
            setIsLoadingGarments(false);
        }
    };

    const handleTryOn = async () => {
        if (!selectedUpper && !selectedLower && !selectedFootwear && !selectedOnePiece) {
            showAlert('Selección incompleta', 'Por favor selecciona al menos una prenda.');
            return;
        }

        if (!userPhotoUri) {
            showAlert('Foto requerida', 'Por favor sube tu foto de cuerpo entero en el perfil.');
            return;
        }

        setIsGenerating(true);
        setLoadingStep('analyzing');

        try {
            // Simulate steps for better UX (extended for ~30-40s generation time)
            setTimeout(() => setLoadingStep('preparing'), 3000);
            setTimeout(() => setLoadingStep('lighting'), 8000);
            setTimeout(() => setLoadingStep('textures'), 15000);
            setTimeout(() => setLoadingStep('refining'), 25000);
            setTimeout(() => setLoadingStep('finalizing'), 35000);

            const upperItem = upperGarments.find(i => i.id === selectedUpper);
            const lowerItem = lowerGarments.find(i => i.id === selectedLower);
            const footwearItem = footwearGarments.find(i => i.id === selectedFootwear);
            const onePieceItem = onePieceGarments.find(i => i.id === selectedOnePiece);

            const result = await generateTryOnImage({
                userImage: userPhotoUri,
                upperGarment: upperItem ? {
                    image: upperItem.image_url,
                    type: upperItem.type,
                    description: upperItem.description
                } : undefined,
                lowerGarment: lowerItem ? {
                    image: lowerItem.image_url,
                    type: lowerItem.type,
                    description: lowerItem.description
                } : undefined,
                footwear: footwearItem ? {
                    image: footwearItem.image_url,
                    type: footwearItem.type,
                    description: footwearItem.description
                } : undefined,
                onePiece: onePieceItem ? {
                    image: onePieceItem.image_url,
                    type: onePieceItem.type,
                    description: onePieceItem.description
                } : undefined,
                modelVersion: 'gemini-3-pro'
            });

            if (result.success && result.imageBase64) {
                setGeneratedImageBase64(result.imageBase64);
            } else {
                showAlert('Error', result.error || 'No se pudo generar la imagen. Intenta de nuevo.');
            }
        } catch (error) {
            showAlert('Error', 'Ocurrió un error al conectar con el servidor.');
        } finally {
            setIsGenerating(false);
            setLoadingStep('');
        }
    };

    const handleReset = () => {
        setGeneratedImageBase64(null);
        setSelectedUpper(null);
        setSelectedLower(null);
        setSelectedFootwear(null);
        setSelectedOnePiece(null);
        setIsComparing(false);
    };

    const handleSavePress = () => {
        if (!generatedImageBase64) return;
        setCategoryModalVisible(true);
    };

    const confirmSave = async (categoryId?: string) => {
        setCategoryModalVisible(false);
        if (!generatedImageBase64) return;

        try {
            const garmentIds: string[] = [];
            if (selectedOnePiece) {
                garmentIds.push(selectedOnePiece);
            } else {
                if (selectedUpper) garmentIds.push(selectedUpper);
                if (selectedLower) garmentIds.push(selectedLower);
            }
            if (selectedFootwear) garmentIds.push(selectedFootwear);

            await saveOutfit({
                imageBase64: generatedImageBase64,
                modelUsed: 'gemini-3-pro',
                categoryId,
                garmentIds,
            });
            showAlert('¡Guardado!', 'Tu outfit ha sido guardado en tu colección.');
            handleReset();
        } catch (error) {
            showAlert('Error', 'No se pudo guardar el outfit.');
        }
    };

    const renderGarmentSection = (
        title: string,
        items: Garment[],
        selectedId: string | null,
        onSelect: (id: string) => void
    ) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {items.length === 0 ? (
                <View style={styles.emptyGarments}>
                    <MaterialIcons name="checkroom" size={32} color="#CCC" />
                    <Text style={styles.emptyText}>No hay prendas</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('Closet')}
                    >
                        <Text style={styles.addButtonText}>+ Agregar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.garmentList}>
                    {items.map((item, index) => (
                        <TouchableOpacity
                            key={`${item.id}-${index}`}
                            style={[
                                styles.garmentCard,
                                selectedId === item.id && styles.selectedGarmentCard
                            ]}
                            onPress={() => onSelect(item.id)}
                        >
                            <Image source={{ uri: item.image_url }} style={styles.garmentImage} resizeMode="cover" />
                            {selectedId === item.id && (
                                <View style={styles.checkBadge}>
                                    <MaterialIcons name="check" size={14} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    if (isLoadingGarments) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loadingText}>Cargando guardarropa...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const totalGarments = upperGarments.length + lowerGarments.length + footwearGarments.length + onePieceGarments.length;

    if (totalGarments === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <PageHeader title="Crear Outfit" />
                <View style={styles.emptyStateContainer}>
                    <MaterialIcons name="checkroom" size={80} color="#CCC" />
                    <Text style={styles.emptyStateTitle}>Tu guardarropa está vacío</Text>
                    <Text style={styles.emptyStateText}>
                        Agrega prendas para comenzar a crear outfits
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyStateButton}
                        onPress={() => navigation.navigate('Closet')}
                    >
                        <MaterialIcons name="add" size={24} color="#FFFFFF" />
                        <Text style={styles.emptyStateButtonText}>Agregar Prendas</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!userPhotoUri) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <PageHeader title="Crear Outfit" />
                <View style={styles.emptyStateContainer}>
                    <MaterialIcons name="person-outline" size={80} color="#CCC" />
                    <Text style={styles.emptyStateTitle}>Subí tu foto de perfil</Text>
                    <Text style={styles.emptyStateText}>
                        Necesitas tu foto de cuerpo entero para probar outfits
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyStateButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <MaterialIcons name="add-a-photo" size={24} color="#FFFFFF" />
                        <Text style={styles.emptyStateButtonText}>Ir a Perfil</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <PageHeader title="Crear Outfit" />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Main Preview Area */}
                <View style={styles.previewContainer}>
                    <TouchableOpacity
                        style={styles.previewCard}
                        activeOpacity={1}
                        onPressIn={() => generatedImageBase64 && setIsComparing(true)}
                        onPressOut={() => setIsComparing(false)}
                        disabled={isGenerating || !generatedImageBase64}
                    >
                        {isGenerating ? (
                            <View style={styles.centerContent}>
                                <ActivityIndicator size="large" color="#000000" />
                                <Text style={styles.loadingText}>
                                    {loadingStep === 'analyzing' && 'Analizando prendas...'}
                                    {loadingStep === 'preparing' && 'Preparando modelo virtual...'}
                                    {loadingStep === 'lighting' && 'Ajustando iluminación y sombras...'}
                                    {loadingStep === 'textures' && 'Aplicando texturas realistas...'}
                                    {loadingStep === 'refining' && 'Refinando detalles finales...'}
                                    {loadingStep === 'finalizing' && 'Generando imagen de alta calidad...'}
                                    {!loadingStep && 'Procesando...'}
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Original Image (Always rendered if available) */}
                                {userPhotoUri && (
                                    <Image
                                        source={{ uri: userPhotoUri }}
                                        style={[styles.previewImage, { position: 'absolute' }]}
                                        resizeMode="cover"
                                    />
                                )}

                                {/* Generated Image (Overlay) */}
                                {generatedImageBase64 && !isGenerating && (
                                    <Image
                                        source={{ uri: `data:image/jpeg;base64,${generatedImageBase64}` }}
                                        style={[
                                            styles.previewImage,
                                            {
                                                position: 'absolute',
                                                opacity: isComparing ? 0 : 1 // Hide when comparing (show original behind)
                                            }
                                        ]}
                                        resizeMode="cover"
                                    />
                                )}
                            </>
                        )}

                        {!isGenerating && generatedImageBase64 && (
                            <View style={styles.previewOverlay}>
                                <Text style={styles.previewOverlayText}>
                                    {isComparing ? 'Foto original' : 'Mantén presionado para comparar'}
                                </Text>
                            </View>
                        )}

                        {/* Save Button Overlay */}
                        {generatedImageBase64 && !isGenerating && !isComparing && (
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSavePress}
                            >
                                <MaterialIcons name="favorite" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Garment Sections */}
                {renderGarmentSection('Cuerpo Completo', onePieceGarments, selectedOnePiece, (id) => {
                    setSelectedOnePiece(id === selectedOnePiece ? null : id);
                    if (id !== selectedOnePiece) {
                        setSelectedUpper(null);
                        setSelectedLower(null);
                    }
                })}

                {renderGarmentSection('Parte Superior', upperGarments, selectedUpper, (id) => {
                    setSelectedUpper(id === selectedUpper ? null : id);
                    if (id !== selectedUpper) {
                        setSelectedOnePiece(null);
                    }
                })}

                {renderGarmentSection('Parte Inferior', lowerGarments, selectedLower, (id) => {
                    setSelectedLower(id === selectedLower ? null : id);
                    if (id !== selectedLower) {
                        setSelectedOnePiece(null);
                    }
                })}

                {renderGarmentSection('Calzado', footwearGarments, selectedFootwear, setSelectedFootwear)}

            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomActionBar}>
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handleReset}
                        disabled={isGenerating}
                    >
                        <Text style={styles.resetButtonText}>Resetear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.tryOnButton}
                        onPress={handleTryOn}
                        disabled={isGenerating}
                    >
                        <Text style={styles.tryOnButtonText}>
                            {isGenerating ? 'Procesando...' : 'Probar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Category Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={categoryModalVisible}
                onRequestClose={() => setCategoryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Guardar en Categoría</Text>
                            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#1A1A1A" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.categoryList}>
                            <TouchableOpacity
                                style={styles.categoryItem}
                                onPress={() => confirmSave(undefined)}
                            >
                                <View style={styles.categoryIcon}>
                                    <MaterialIcons name="checkroom" size={20} color="#666" />
                                </View>
                                <Text style={styles.categoryText}>Sin categoría</Text>
                                <MaterialIcons name="chevron-right" size={20} color="#CCC" />
                            </TouchableOpacity>

                            {categories.map((category, index) => (
                                <TouchableOpacity
                                    key={`${category.id}-${index}`}
                                    style={styles.categoryItem}
                                    onPress={() => confirmSave(category.id)}
                                >
                                    <View style={styles.categoryIcon}>
                                        <MaterialIcons name="label-outline" size={20} color="#666" />
                                    </View>
                                    <Text style={styles.categoryText}>{category.name}</Text>
                                    <MaterialIcons name="chevron-right" size={20} color="#CCC" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView >
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
        gap: 16,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666666',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 24,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    emptyStateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#000',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyStateButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Space for bottom bar
    },
    previewContainer: {
        paddingHorizontal: 16,
        marginBottom: 24,
        marginTop: 12,
    },
    previewCard: {
        position: 'relative',
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    previewOverlayText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    saveButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker background
        justifyContent: 'center',
        alignItems: 'center',
        // Add shadow for better visibility
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
        letterSpacing: -0.2,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    emptyGarments: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
        paddingHorizontal: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
    },
    addButton: {
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#000',
        borderRadius: 6,
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    garmentList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    garmentCard: {
        width: 128,
        aspectRatio: 3 / 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
        position: 'relative',
        marginRight: 12,
    },
    selectedGarmentCard: {
        borderWidth: 2,
        borderColor: '#000000',
    },
    garmentImage: {
        width: '100%',
        height: '100%',
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomActionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    resetButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#000000',
        backgroundColor: '#FFFFFF',
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
    },
    tryOnButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#000000',
    },
    tryOnButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    categoryList: {
        maxHeight: 400,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryText: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
});
