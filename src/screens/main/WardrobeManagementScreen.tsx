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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { createGarment, getGarments, deleteGarment, Garment } from '../../services/supabaseService';
import CustomAlert from '../../components/CustomAlert';
import { colors, typography, spacing } from '../../constants/theme';

type GarmentCategory = 'upper' | 'lower' | 'footwear';

export default function WardrobeManagementScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [selectedTab, setSelectedTab] = useState<GarmentCategory>('upper');
    const [garments, setGarments] = useState<Garment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

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
        if (!user) return;

        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                showAlert('Permiso Necesario', 'Necesitamos acceso a tus fotos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploading(true);
                const imageUri = result.assets[0].uri;

                // Get garment type based on category
                const typeMap: Record<GarmentCategory, string> = {
                    upper: 'Camisa',
                    lower: 'Pantalón',
                    footwear: 'Zapatillas',
                };

                const { data, error } = await createGarment(
                    user.id,
                    selectedTab,
                    typeMap[selectedTab],
                    `${typeMap[selectedTab]} - ${new Date().toLocaleDateString()}`,
                    imageUri
                );

                if (error) {
                    showAlert('Error', 'No se pudo subir la prenda');
                    return;
                }

                if (data) {
                    setGarments([data, ...garments]);
                    showAlert('¡Éxito!', 'Prenda agregada a tu guardarropa');
                }
            }
        } catch (error) {
            console.error('Error uploading garment:', error);
            showAlert('Error', 'Ocurrió un error al subir la prenda');
        } finally {
            setIsUploading(false);
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Guardarropa</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
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
                        {filteredGarments.map((garment) => (
                            <View key={garment.id} style={styles.garmentCard}>
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

            {/* Upload Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
                    onPress={handleUpload}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <MaterialIcons name="add-photo-alternate" size={24} color="#FFFFFF" />
                            <Text style={styles.uploadButtonText}>Subir Prenda</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
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
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 48,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
        backgroundColor: '#FFFFFF',
    },
    tab: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 4,
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
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
        backgroundColor: '#FFFFFF',
    },
    uploadButton: {
        flexDirection: 'row',
        height: 56,
        backgroundColor: '#000',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadButtonDisabled: {
        opacity: 0.6,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
