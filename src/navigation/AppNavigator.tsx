import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function AppNavigator() {
    const { session, isLoading, isFirstLaunch } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000000" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {session ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
});
