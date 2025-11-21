import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { upperBodyGarments, lowerBodyGarments, footwear } from '../../constants/mockData';
import { GarmentCategory } from '../../types';
import { callGeminiAPI } from '../../services/geminiAPI';
import { useOutfits } from '../../context/OutfitContext';
import { useUserPhoto } from '../../context/UserPhotoContext';
import { mockUser } from '../../constants/mockData';
import { ImagePickerAsset } from 'expo-image-picker';
import CustomAlert from '../../components/CustomAlert';
import ModelSelector from '../../components/ModelSelector';
import { generateTryOnImage } from '../../services/gemini';

export default function WardrobeScreen() {
    const [selectedUpper, setSelectedUpper] = useState<string | null>(null);
    const [selectedLower, setSelectedLower] = useState<string | null>(null);
    const [selectedFootwear, setSelectedFootwear] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<'gemini-3-pro' | 'gemini-2.5-flash'>('gemini-3-pro');
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);

    const [isComparing, setIsComparing] = useState(false);

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

    const { saveOutfit, categories } = useOutfits();
    const { userPhotoUri } = useUserPhoto();

    // Use user photo from context or fallback to mock
    const userImage = userPhotoUri || mockUser.image;

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ title, message });
        setAlertVisible(true);
    };

    const handleTryOn = async () => {
        if (!selectedUpper && !selectedLower && !selectedFootwear) {
            showAlert('Selección incompleta', 'Por favor selecciona al menos una prenda.');
            return;
        }

        setIsGenerating(true);
        try {
            const upperItem = upperBodyGarments.find(i => i.id === selectedUpper);
            const lowerItem = lowerBodyGarments.find(i => i.id === selectedLower);
            const footwearItem = footwear.find(i => i.id === selectedFootwear);

            const result = await generateTryOnImage({
                userImage: userImage,
                upperGarment: upperItem ? { image: upperItem.image, type: upperItem.type, description: upperItem.description, fit: upperItem.fit } : undefined,
                lowerGarment: lowerItem ? { image: lowerItem.image, type: lowerItem.type, description: lowerItem.description, fit: lowerItem.fit } : undefined,
                footwear: footwearItem ? { image: footwearItem.image, type: footwearItem.type, description: footwearItem.description, fit: footwearItem.fit } : undefined,
                modelVersion: selectedModel
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
        }
    };

    const handleReset = () => {
        setGeneratedImageBase64(null);
        setSelectedUpper(null);
        setSelectedLower(null);
        setSelectedFootwear(null);
    };

    const handleSavePress = () => {
        if (!generatedImageBase64) return;
        setCategoryModalVisible(true);
    };

    const confirmSave = async (categoryId?: string) => {
        setCategoryModalVisible(false);
        if (!generatedImageBase64) return;

        try {
            const upperItem = upperBodyGarments.find(i => i.id === selectedUpper);
            const lowerItem = lowerBodyGarments.find(i => i.id === selectedLower);
            const footwearItem = footwear.find(i => i.id === selectedFootwear);

            await saveOutfit({
                imageBase64: generatedImageBase64,
                modelUsed: selectedModel,
                categoryId,
                garments: {
                    upper: upperItem ? { type: upperItem.type, description: upperItem.description } : undefined,
                    lower: lowerItem ? { type: lowerItem.type, description: lowerItem.description } : undefined,
                    footwear: footwearItem ? { type: footwearItem.type, description: footwearItem.description } : undefined
                }
            });
            showAlert('¡Guardado!', 'Tu outfit ha sido guardado en tu colección.');
        } catch (error) {
            showAlert('Error', 'No se pudo guardar el outfit.');
        }
    };

    const renderGarmentSection = (title: string, items: typeof upperBodyGarments, selectedId: string | null, onSelect: (id: string) => void) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.garmentList}>
                {items.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.garmentCard,
                            selectedId === item.id && styles.selectedGarmentCard
                        ]}
                        onPress={() => onSelect(item.id)}
                    >
                        <Image
                            source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                            style={styles.garmentImage}
                            resizeMode="cover"
                        />
                        {selectedId === item.id && (
                            <View style={styles.checkBadge}>
                                <MaterialIcons name="check" size={14} color="#FFFFFF" />
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerSpacer} />
                <Text style={styles.headerTitle}>Probador Virtual</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Model Selection */}
                <View style={styles.modelSelectionContainer}>
                    <View style={styles.modelSelectionWrapper}>
                        <TouchableOpacity
                            style={[
                                styles.modelOption,
                                selectedModel === 'gemini-3-pro' && styles.selectedModelOption
                            ]}
                            onPress={() => setSelectedModel('gemini-3-pro')}
                        >
                            <Text style={[
                                styles.modelOptionText,
                                selectedModel === 'gemini-3-pro' && styles.selectedModelOptionText
                            ]}>Gemini 3 Pro</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modelOption,
                                selectedModel === 'gemini-2.5-flash' && styles.selectedModelOption
                            ]}
                            onPress={() => setSelectedModel('gemini-2.5-flash')}
                        >
                            <Text style={[
                                styles.modelOptionText,
                                selectedModel === 'gemini-2.5-flash' && styles.selectedModelOptionText
                            ]}>2.5 Flash</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Preview Area */}
                <View style={styles.previewContainer}>
                    <TouchableOpacity
                        style={styles.previewCard}
                        activeOpacity={1}
                        onPressIn={() => setIsComparing(true)}
                        onPressOut={() => setIsComparing(false)}
                        disabled={isGenerating || !generatedImageBase64}
                    >
                        {isGenerating ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#000000" />
                                <Text style={styles.loadingText}>Generando tu look...</Text>
                            </View>
                        ) : (
                            <Image
                                source={
                                    generatedImageBase64 && !isComparing
                                        ? { uri: `data:image/jpeg;base64,${generatedImageBase64}` }
                                        : (typeof userImage === 'string' ? { uri: userImage } : userImage)
                                }
                                style={styles.previewImage}
                                resizeMode="cover"
                            />
                        )}

                        {!isGenerating && generatedImageBase64 && !isComparing && (
                            <View style={styles.previewOverlay}>
                                <Text style={styles.previewOverlayText}>Mantén presionado para comparar</Text>
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
                {renderGarmentSection('Parte Superior', upperBodyGarments, selectedUpper, setSelectedUpper)}
                {renderGarmentSection('Parte Inferior', lowerBodyGarments, selectedLower, setSelectedLower)}
                {renderGarmentSection('Calzado', footwear, selectedFootwear, setSelectedFootwear)}

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
                            <Text style={styles.modalTitle}>Save to Category</Text>
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
                                <Text style={styles.categoryText}>Uncategorized</Text>
                                <MaterialIcons name="chevron-right" size={20} color="#CCC" />
                            </TouchableOpacity>

                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
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
        paddingBottom: 8,
        paddingTop: 8,
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
        letterSpacing: -0.2,
        textAlign: 'center',
        flex: 1,
    },
    headerSpacer: {
        width: 48,
        height: 48,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Space for bottom bar
    },
    modelSelectionContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    modelSelectionWrapper: {
        flexDirection: 'row',
        height: 40,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        padding: 4,
    },
    modelOption: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    selectedModelOption: {
        backgroundColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    modelOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
    },
    selectedModelOptionText: {
        color: '#FFFFFF',
    },
    previewContainer: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    previewCard: {
        position: 'relative',
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: '#E5E7EB', // gray-200
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666666',
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
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
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
    garmentList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    garmentCard: {
        width: 128, // w-32
        aspectRatio: 3 / 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB', // gray-200
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
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
