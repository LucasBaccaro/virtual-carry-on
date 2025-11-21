import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { useUserPhoto } from '../../context/UserPhotoContext';
import { useAuth } from '../../context/AuthContext';
import { mockUser } from '../../constants/mockData';
import CustomAlert from '../../components/CustomAlert';

export default function ProfileScreen() {
    const { userPhotoUri, setUserPhoto, removeUserPhoto, isLoading } = useUserPhoto();
    const { signOut } = useAuth();
    const [uploading, setUploading] = useState(false);

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
    }>({ title: '', message: '' });

    const showAlert = (title: string, message: string, buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[]) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };

    const requestPermissions = async (type: 'camera' | 'library') => {
        if (type === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showAlert(
                    'Permission Required',
                    'We need access to your camera to take photos.',
                    [{ text: 'OK', onPress: () => setAlertVisible(false) }]
                );
                return false;
            }
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showAlert(
                    'Permission Required',
                    'We need access to your library to select photos.',
                    [{ text: 'OK', onPress: () => setAlertVisible(false) }]
                );
                return false;
            }
        }
        return true;
    };

    const handleTakePhoto = async () => {
        const hasPermission = await requestPermissions('camera');
        if (!hasPermission) return;

        setUploading(true);
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await setUserPhoto(result.assets[0].uri);
                showAlert('Success', 'Your photo has been saved');
            }
        } catch (error) {
            showAlert('Error', 'Could not take photo');
        } finally {
            setUploading(false);
        }
    };

    const handleChoosePhoto = async () => {
        const hasPermission = await requestPermissions('library');
        if (!hasPermission) return;

        setUploading(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await setUserPhoto(result.assets[0].uri);
                showAlert('Success', 'Your photo has been saved');
            }
        } catch (error) {
            showAlert('Error', 'Could not select photo');
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePhoto = () => {
        showAlert(
            'Delete Photo',
            'Are you sure you want to delete your photo?',
            [
                { text: 'Cancel', style: 'cancel', onPress: () => setAlertVisible(false) },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeUserPhoto();
                            setAlertVisible(false); // Close confirmation
                            // Show success after a brief delay or immediately?
                            // Alert.alert was blocking, CustomAlert is not.
                            // We can just show another alert.
                            setTimeout(() => {
                                showAlert('Deleted', 'Default photo will be used');
                            }, 300);
                        } catch (error) {
                            setAlertVisible(false);
                            setTimeout(() => {
                                showAlert('Error', 'Could not delete photo');
                            }, 300);
                        }
                    },
                },
            ]
        );
    };

    const displayImage = userPhotoUri || mockUser.image;
    const isCustomPhoto = !!userPhotoUri;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Tu Foto</Text>
                <Text style={styles.subtitle}>Foto activa</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Photo Card */}
                <View style={styles.photoCardContainer}>
                    <View style={styles.photoCard}>
                        {uploading || isLoading ? (
                            <View style={styles.photoPlaceholder}>
                                <ActivityIndicator size="large" color="#000000" />
                            </View>
                        ) : (
                            <Image
                                source={typeof displayImage === 'string' ? { uri: displayImage } : displayImage}
                                style={styles.photo}
                                resizeMode="cover"
                            />
                        )}
                        {isCustomPhoto && !uploading && (
                            <View style={styles.badge}>
                                <MaterialIcons name="check" size={16} color="#FFFFFF" />
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleTakePhoto}
                        disabled={uploading}
                    >
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="photo-camera" size={24} color="#000000" />
                        </View>
                        <Text style={styles.actionButtonText}>Tomar Foto</Text>
                        <MaterialIcons name="chevron-right" size={24} color="rgba(0,0,0,0.5)" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleChoosePhoto}
                        disabled={uploading}
                    >
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="photo-library" size={24} color="#000000" />
                        </View>
                        <Text style={styles.actionButtonText}>Elegir de Galería</Text>
                        <MaterialIcons name="chevron-right" size={24} color="rgba(0,0,0,0.5)" />
                    </TouchableOpacity>

                    {isCustomPhoto && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={handleRemovePhoto}
                            disabled={uploading}
                        >
                            <View style={styles.iconContainer}>
                                <MaterialIcons name="delete-outline" size={24} color="#000000" />
                            </View>
                            <Text style={styles.actionButtonText}>Eliminar Foto</Text>
                            <MaterialIcons name="chevron-right" size={24} color="rgba(0,0,0,0.5)" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Logout Button */}
                <View style={styles.logoutContainer}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={() => {
                            showAlert(
                                'Logout',
                                'Are you sure you want to logout?',
                                [
                                    { text: 'Cancel', style: 'cancel', onPress: () => setAlertVisible(false) },
                                    {
                                        text: 'Logout',
                                        style: 'destructive',
                                        onPress: async () => {
                                            await signOut();
                                            setAlertVisible(false);
                                        },
                                    },
                                ]
                            );
                        }}
                    >
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="logout" size={24} color="#DC2626" />
                        </View>
                        <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>Logout</Text>
                        <MaterialIcons name="chevron-right" size={24} color="rgba(220, 38, 38, 0.5)" />
                    </TouchableOpacity>
                </View>

                {/* Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>
                        Para obtener los mejores resultados, usa una foto con buena iluminación y un fondo neutro. Asegúrate de que tu rostro y torso estén claramente visibles.
                    </Text>
                </View>
            </ScrollView>

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
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000000',
        letterSpacing: -0.5,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: 'rgba(0,0,0,0.6)',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
    },
    photoCardContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    photoCard: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: 16, // rounded-xl
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        overflow: 'hidden',
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionsContainer: {
        paddingHorizontal: spacing.lg,
        gap: 12, // gap-3
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56, // min-h-14
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
    },
    deleteButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    logoutContainer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        marginTop: spacing.md,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.2)',
    },
    infoContainer: {
        marginTop: 'auto',
        paddingTop: 32,
        paddingBottom: 24,
        paddingHorizontal: spacing.lg,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '400',
        color: 'rgba(0,0,0,0.6)',
        textAlign: 'center',
        lineHeight: 20,
    },
});
