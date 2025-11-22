import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StatusBar,
    Alert,
    Modal,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { createGarment, getGarments, deleteGarment, processGarmentImage, Garment } from '../../services/supabaseService';
import CustomAlert from '../../components/CustomAlert';
import CustomDeleteDialog from '../../components/CustomDeleteDialog';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type GarmentCategory = 'upper' | 'lower' | 'footwear' | 'one-piece';

interface WardrobeManagementScreenProps {
    hideHeader?: boolean;
}

export default function WardrobeManagementScreen({ hideHeader = false }: WardrobeManagementScreenProps) {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [selectedTab, setSelectedTab] = useState<GarmentCategory>('upper');
    const [garments, setGarments] = useState<Garment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [scanningImageUri, setScanningImageUri] = useState<string | null>(null);

    // Scanner animation
    const scannerPosition = useRef(new Animated.Value(0)).current;

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
    }>({ title: '', message: '' });

    const showAlert = (
        title: string,
        message: string,
        buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[]
    ) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };

    useEffect(() => {
        loadGarments();
    }, [selectedTab]);

    // Start scanner animation when uploading
    useEffect(() => {
        if (isUploading) {
            // Reset and start animation
            scannerPosition.setValue(0);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scannerPosition, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scannerPosition, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [isUploading]);

    const loadGarments = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const { data, error } = await getGarments(user.id, selectedTab);

            if (error) {
                showAlert('Error', 'No se pudieron cargar las prendas');
                return;
            }

            setGarments(data || []);
        } catch (error) {
            console.error('Error loading garments:', error);
            showAlert('Error', 'Ocurrió un error al cargar las prendas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async () => {
        console.log('🟢 [handleUpload] Iniciando proceso de subida...');

        if (!user) {
            console.error('❌ [handleUpload] No hay usuario autenticado');
            return;
        }

        console.log('👤 [handleUpload] Usuario:', user.id);

        try {
            console.log('📸 [handleUpload] Solicitando permiso de galería...');
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                console.warn('⚠️ [handleUpload] Permiso de galería denegado');
                showAlert('Permiso Necesario', 'Necesitamos acceso a tus fotos');
                return;
            }

            console.log('✅ [handleUpload] Permiso de galería concedido');
            console.log('🖼️ [handleUpload] Abriendo selector de imágenes...');

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });

            console.log('📊 [handleUpload] Resultado del selector:', { canceled: result.canceled, assetsCount: result.assets?.length });

            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;

                // Set scanning state
                setScanningImageUri(imageUri);
                setIsUploading(true);

                console.log('🎯 [handleUpload] Imagen seleccionada:', imageUri);
                console.log('📂 [handleUpload] Categoría seleccionada:', selectedTab);

                // Get garment type based on category
                const typeMap: Record<GarmentCategory, string> = {
                    upper: 'Camisa',
                    lower: 'Pantalón',
                    footwear: 'Zapatillas',
                    'one-piece': 'Cuerpo Completo',
                };

                const garmentType = typeMap[selectedTab];
                const garmentDescription = `${garmentType} - ${new Date().toLocaleDateString()}`;

                console.log('📝 [handleUpload] Tipo de prenda:', garmentType);
                console.log('📝 [handleUpload] Descripción:', garmentDescription);
                console.log('⏳ [handleUpload] Procesando imagen con IA...');

                // Process image (remove background + AI analysis) without saving to DB
                const processResult = await processGarmentImage(
                    imageUri,
                    selectedTab,
                    garmentType,
                    garmentDescription
                );

                if (!processResult.success || !processResult.imageBase64) {
                    console.error('❌ [handleUpload] Error al procesar imagen:', processResult.error);
                    showAlert('Error', 'No se pudo procesar la imagen. Intenta de nuevo.');
                    return;
                }

                console.log('✅ [handleUpload] Imagen procesada exitosamente');
                console.log('🧭 [handleUpload] Navegando a EditGarmentScreen...');

                // Navigate to EditGarmentScreen with processed data
                navigation.navigate('EditGarment' as never, {
                    imageBase64: processResult.imageBase64,
                    category: selectedTab,
                    type: garmentType,
                    description: garmentDescription,
                    metadata: processResult.metadata,
                    aiAnalysis: processResult.aiAnalysis,
                } as never);
            } else {
                console.log('ℹ️ [handleUpload] Usuario canceló la selección de imagen');
            }
        } catch (error) {
            console.error('❌ [handleUpload] ERROR GENERAL EN HANDLEUPLOAD:');
            console.error('Error completo:', error);
            if (error instanceof Error) {
                console.error('Error.name:', error.name);
                console.error('Error.message:', error.message);
                console.error('Error.stack:', error.stack);
            }
            showAlert('Error', `Ocurrió un error al subir la prenda: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            console.log('🏁 [handleUpload] Finalizando proceso de subida');
            setIsUploading(false);
            setScanningImageUri(null);
        }
    };

    const handleDelete = (garment: Garment) => {
        showAlert('Eliminar Prenda', '¿Estás seguro de eliminar esta prenda?', [
            { text: 'Cancelar', style: 'cancel', onPress: () => setAlertVisible(false) },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    setAlertVisible(false);
                    try {
                        const { error } = await deleteGarment(garment.id, garment.image_url);
                        if (error) {
                            showAlert('Error', 'No se pudo eliminar la prenda');
                            return;
                        }
                        setGarments(garments.filter((g) => g.id !== garment.id));
                    } catch (error) {
                        console.error('Error deleting garment:', error);
                        showAlert('Error', 'Ocurrió un error al eliminar la prenda');
                    }
                },
            },
        ]);
    };

    const filteredGarments = garments.filter((g) => g.category === selectedTab);

    const content = (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {!hideHeader && (
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Gestionar Prendas</Text>
                </View>
            )}

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                >
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'upper' && styles.activeTab]}
                        onPress={() => setSelectedTab('upper')}
                    >
                        <MaterialIcons name="checkroom" size={24} color={selectedTab === 'upper' ? '#000' : '#999'} />
                        <Text style={[styles.tabText, selectedTab === 'upper' && styles.activeTabText]}>
                            Parte Superior
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'lower' && styles.activeTab]}
                        onPress={() => setSelectedTab('lower')}
                    >
                        <MaterialIcons name="checkroom" size={24} color={selectedTab === 'lower' ? '#000' : '#999'} />
                        <Text style={[styles.tabText, selectedTab === 'lower' && styles.activeTabText]}>
                            Parte Inferior
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'footwear' && styles.activeTab]}
                        onPress={() => setSelectedTab('footwear')}
                    >
                        <MaterialIcons name="directions-walk" size={24} color={selectedTab === 'footwear' ? '#000' : '#999'} />
                        <Text style={[styles.tabText, selectedTab === 'footwear' && styles.activeTabText]}>Calzado</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'one-piece' && styles.activeTab]}
                        onPress={() => setSelectedTab('one-piece')}
                    >
                        <MaterialIcons name="accessibility-new" size={24} color={selectedTab === 'one-piece' ? '#000' : '#999'} />
                        <Text style={[styles.tabText, selectedTab === 'one-piece' && styles.activeTabText]}>Cuerpo Completo</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#000" />
                    </View>
                ) : filteredGarments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="checkroom" size={64} color="#CCC" />
                        <Text style={styles.emptyTitle}>No hay prendas</Text>
                        <Text style={styles.emptyText}>Sube tu primera prenda para comenzar</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {filteredGarments.map((garment, index) => (
                            <View key={`garment-${garment.id}-${index}`} style={styles.garmentCard}>
                                <Image source={{ uri: garment.image_url }} style={styles.garmentImage} />
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(garment)}
                                >
                                    <MaterialIcons name="delete" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>



            {/* FAB Upload Button */}
            <TouchableOpacity
                style={[styles.fab, isUploading && styles.fabDisabled]}
                onPress={handleUpload}
                disabled={isUploading}
            >
                {isUploading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <MaterialIcons name="add" size={32} color="#FFFFFF" />
                )}
            </TouchableOpacity>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setAlertVisible(false)}
            />

            {/* Scanner Modal */}
            <Modal
                visible={isUploading && !!scanningImageUri}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.scannerContainer}>
                    {/* Background Image with Opacity */}
                    {scanningImageUri && (
                        <Image
                            source={{ uri: scanningImageUri }}
                            style={styles.scannerImage}
                            resizeMode="contain"
                        />
                    )}

                    {/* Dark Overlay */}
                    <View style={styles.scannerOverlay} />

                    {/* Scanning Line Animation */}
                    <Animated.View
                        style={[
                            styles.scannerLine,
                            {
                                transform: [
                                    {
                                        translateY: scannerPosition.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, SCREEN_HEIGHT * 0.8],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.scannerLineGlow} />
                    </Animated.View>

                    {/* Status Text */}
                    <View style={styles.scannerTextContainer}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <Text style={styles.scannerText}>Procesando con IA...</Text>
                        <Text style={styles.scannerSubtext}>Optimizando tu prenda</Text>
                    </View>
                </View>
            </Modal>
        </>
    );

    if (hideHeader) {
        return <View style={styles.container}>{content}</View>;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {content}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    tabsWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
        backgroundColor: '#FFFFFF',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
    tab: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 4,
        minWidth: 100,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#000',
    },
    tabText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#000',
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    garmentCard: {
        width: '48%',
        aspectRatio: 3 / 4,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
        position: 'relative',
    },
    garmentImage: {
        width: '100%',
        height: '100%',
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    fabDisabled: {
        opacity: 0.7,
    },
    // Scanner Modal Styles
    scannerContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 1,
    },
    scannerOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    scannerLine: {
        position: 'absolute',
        top: '10%',
        left: 0,
        right: 0,
        height: 2,
        zIndex: 10,
    },
    scannerLineGlow: {
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
    },
    scannerTextContainer: {
        position: 'absolute',
        bottom: 100,
        alignItems: 'center',
        gap: 12,
    },
    scannerText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    scannerSubtext: {
        fontSize: 14,
        color: '#CCCCCC',
        textAlign: 'center',
    },
});
