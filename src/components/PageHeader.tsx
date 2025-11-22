import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useUserPhoto } from '../context/UserPhotoContext';
import { colors, spacing } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface PageHeaderProps {
    title: string;
    showBackButton?: boolean;
}

export default function PageHeader({ title, showBackButton = false }: PageHeaderProps) {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { userPhotoUri } = useUserPhoto();

    const handleProfilePress = () => {
        navigation.navigate('Profile' as never);
    };

    const handleBackPress = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.header}>
            {showBackButton && (
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
            )}
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
                {userPhotoUri ? (
                    <Image
                        source={{ uri: userPhotoUri }}
                        style={styles.profilePhoto}
                    />
                ) : (
                    <View style={styles.profilePhotoPlaceholder}>
                        <Text style={styles.profileInitials}>
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    backButton: {
        position: 'absolute',
        left: spacing.lg,
    },
    profileButton: {
        position: 'absolute',
        right: spacing.lg,
    },
    profilePhoto: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F3F4F6',
    },
    profilePhotoPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitials: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
