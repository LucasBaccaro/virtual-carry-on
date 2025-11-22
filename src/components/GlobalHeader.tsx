import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useUserPhoto } from '../context/UserPhotoContext';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../constants/theme';

export default function GlobalHeader() {
    const { user } = useAuth();
    const { userPhotoUri } = useUserPhoto();
    const navigation = useNavigation();

    return (
        <View style={styles.header}>
            {/* Profile Photo - Right Side */}
            <TouchableOpacity
                onPress={() => navigation.navigate('Profile' as never)}
                style={styles.profileButton}
            >
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
        justifyContent: 'flex-end',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: '#FFFFFF',
    },
    profileButton: {
        // No extra styling needed
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
    welcomeTextContainer: {
        flex: 1,
    },
    welcomeGreeting: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    userEmailInline: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    notificationButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: '#F9FAFB',
    },
});
