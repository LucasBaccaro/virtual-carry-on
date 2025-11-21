import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { useOutfits } from '../../context/OutfitContext';
import { useUserPhoto } from '../../context/UserPhotoContext';
import { useAuth } from '../../context/AuthContext';
import { getGarments, Garment } from '../../services/supabaseService';
import CustomAlert from '../../components/CustomAlert';
import ModelSelector from '../../components/ModelSelector';
import { generateTryOnImage } from '../../services/gemini';

export default function WardrobeScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { saveOutfit, categories } = useOutfits();
    const { userPhotoUri } = useUserPhoto();

    // Garments from Supabase
    const [upperGarments, setUpperGarments] = useState<Garment[]>([]);
    const [lowerGarments, setLowerGarments] = useState<Garment[]>([]);
    const [footwearGarments, setFootwearGarments] = useState<Garment[]>([]);
    const [isLoadingGarments, setIsLoadingGarments] = useState(true);

    // Selection state
    const [selectedUpper, setSelectedUpper] = useState<string | null>(null);
    const [selectedLower, setSelectedLower] = useState<string | null>(null);
    const [selectedFootwear, setSelectedFootwear] = useState<string | null>(null);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<'gemini-3-pro' | 'gemini-2.5-flash'>('gemini-3-pro');
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ title, message });
        setAlertVisible(true);
    };

    // Load garments from Supabase on mount
    useEffect(() => {
        loadGarments();
    }, [user]);

    const loadGarments = async () => {
        if (!user) return;

        try {
            setIsLoadingGarments(true);
            const [upperResult, lowerResult, footwearResult] = await Promise.all([
                getGarments(user.id, 'upper'),
                getGarments(user.id, 'lower'),
                getGarments(user.id, 'footwear'),
            ]);

            if (upperResult.data) setUpperGarments(upperResult.data);
            if (lowerResult.data) setLowerGarments(lowerResult.data);
            if (footwearResult.data) setFootwearGarments(footwearResult.data);
        } catch (error) {
            console.error('Error loading garments:', error);
            showAlert('Error', 'No se pudieron cargar las prendas');
        } finally {
            setIsLoadingGarments(false);
        }
    };

    const handleTryOn = async () => {
        if (!selectedUpper && !selectedLower && !selectedFootwear) {
            showAlert('Selección incompleta', 'Por favor selecciona al menos una prenda.');
            return;
        }

        if (!userPhotoUri) {
            showAlert('Foto requerida', 'Por favor sube tu foto de cuerpo entero en el perfil.');
            return;
        }

        setIsGenerating(true);
        try {
            const upperItem = upperGarments.find(i => i.id === selectedUpper);
            const lowerItem = lowerGarments.find(i => i.id === selectedLower);
            const footwearItem = footwearGarments.find(i => i.id === selectedFootwear);

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
            const garmentIds: string[] = [];
            if (selectedUpper) garmentIds.push(selectedUpper);
            if (selectedLower) garmentIds.push(selectedLower);
            if (selectedFootwear) garmentIds.push(selectedFootwear);

            await saveOutfit({
                imageBase64: generatedImageBase64,
                modelUsed: selectedModel,
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
                        onPress={() => navigation.navigate('WardrobeManagement')}
                    >
                        <Text style={styles.addButtonText}>+ Agregar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
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
                            <Image source={{ uri: item.image_url }} style={styles.garmentImage} />
                            {selectedId === item.id && (
                                <View style={styles.selectedBadge}>
                                    <MaterialIcons name="check" size={16} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    const renderCategoryModal = () => (
        <Modal
            visible={categoryModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setCategoryModalVisible(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setCategoryModalVisible(false)}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Guardar en categoría</Text>
                    <ScrollView style={styles.categoryList}>
                        <TouchableOpacity
                            style={styles.categoryOption}
                            onPress={() => confirmSave()}
                        >
                            <Text style={styles.categoryText}>Sin categoría</Text>
                        </TouchableOpacity>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={styles.categoryOption}
                                onPress={() => confirmSave(cat.id)}
                            >
                                <Text style={styles.categoryText}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={styles.modalCancelButton}
                        onPress={() => setCategoryModalVisible(false)}
                    >
                        <Text style={styles.modalCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
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

    const totalGarments = upperGarments.length + lowerGarments.length + footwearGarments.length;

    if (totalGarments === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.emptyStateContainer}>
                    <MaterialIcons name="checkroom" size={80} color="#CCC" />
                    <Text style={styles.emptyStateTitle}>Tu guardarropa está vacío</Text>
                    <Text style={styles.emptyStateText}>
                        Agrega prendas para comenzar a crear outfits
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyStateButton}
                        onPress={() => navigation.navigate('WardrobeManagement')}
                    >
                        <MaterialIcons name="add" size={24} color="#FFFFFF" />
                        <Text style={styles.emptyStateButtonText}>Agregar Prendas</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Probador Virtual</Text>
                    <Text style={styles.subtitle}>{totalGarments} prendas</Text>
                </View>
                <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => navigation.navigate('WardrobeManagement')}
                >
                    <MaterialIcons name="settings" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Model Selector */}
                <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />

                {/* Garment Sections */}
                {renderGarmentSection('Parte Superior', upperGarments, selectedUpper, setSelectedUpper)}
                {renderGarmentSection('Parte Inferior', lowerGarments, selectedLower, setSelectedLower)}
                {renderGarmentSection('Calzado', footwearGarments, selectedFootwear, setSelectedFootwear)}

                {/* Generated Image Preview */}
                {generatedImageBase64 && (
                    <View style={styles.previewSection}>
                        <Text style={styles.sectionTitle}>Vista Previa</Text>
                        <Image
                            source={{ uri: `data:image/jpeg;base64,${generatedImageBase64}` }}
                            style={styles.previewImage}
                            resizeMode="contain"
                        />
                        <View style={styles.previewActions}>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSavePress}>
                                <MaterialIcons name="save" size={20} color="#FFFFFF" />
                                <Text style={styles.saveButtonText}>Guardar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                                <MaterialIcons name="refresh" size={20} color="#000" />
                                <Text style={styles.resetButtonText}>Reintentar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Action Button */}
            {!generatedImageBase64 && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.tryOnButton, isGenerating && styles.tryOnButtonDisabled]}
                        onPress={handleTryOn}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <MaterialIcons name="auto-awesome" size={24} color="#FFFFFF" />
                                <Text style={styles.tryOnButtonText}>Probar Outfit</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Category Modal */}
            {renderCategoryModal()}

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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
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
        paddingVertical: 16,
        borderRadius: 8,
    },
    emptyStateButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    manageButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    garmentList: {
        gap: 12,
    },
    garmentCard: {
        width: 100,
        height: 120,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedGarmentCard: {
        borderColor: '#000',
    },
    garmentImage: {
        width: '100%',
        height: '100%',
    },
    selectedBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyGarments: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
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
    previewSection: {
        marginTop: 16,
    },
    previewImage: {
        width: '100%',
        height: 400,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
    },
    previewActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#000',
        paddingVertical: 16,
        borderRadius: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    resetButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F5F5F5',
        paddingVertical: 16,
        borderRadius: 8,
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
    },
    tryOnButton: {
        flexDirection: 'row',
        height: 56,
        backgroundColor: '#000',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    tryOnButtonDisabled: {
        opacity: 0.6,
    },
    tryOnButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    categoryList: {
        maxHeight: 300,
    },
    categoryOption: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    categoryText: {
        fontSize: 16,
        color: '#1A1A1A',
    },
    modalCancelButton: {
        marginTop: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
});
