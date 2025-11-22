import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface PageHeaderProps {
    title: string;
    showBackButton?: boolean;
}

export default function PageHeader({ title, showBackButton = false }: PageHeaderProps) {
    const navigation = useNavigation();

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
});
