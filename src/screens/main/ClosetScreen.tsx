import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../../components/PageHeader';
import WardrobeManagementScreen from './WardrobeManagementScreen';

export default function ClosetScreen() {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <PageHeader
                title="Mi Ropa"
            />

            {/* Content */}
            <View style={styles.content}>
                <WardrobeManagementScreen hideHeader />
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
    },
});
