import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserPhotoContextType {
    userPhotoUri: string | null;
    setUserPhoto: (uri: string) => Promise<void>;
    removeUserPhoto: () => Promise<void>;
    isLoading: boolean;
}

const UserPhotoContext = createContext<UserPhotoContextType | undefined>(undefined);

const STORAGE_KEY = '@smartfit_user_photo';

export function UserPhotoProvider({ children }: { children: ReactNode }) {
    const [userPhotoUri, setUserPhotoUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved photo on mount
    useEffect(() => {
        loadUserPhoto();
    }, []);

    const loadUserPhoto = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setUserPhotoUri(stored);
            }
        } catch (error) {
            console.error('Error loading user photo:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setUserPhoto = async (uri: string) => {
        try {
            setUserPhotoUri(uri);
            await AsyncStorage.setItem(STORAGE_KEY, uri);
        } catch (error) {
            console.error('Error saving user photo:', error);
            throw error;
        }
    };

    const removeUserPhoto = async () => {
        try {
            setUserPhotoUri(null);
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error removing user photo:', error);
            throw error;
        }
    };

    return (
        <UserPhotoContext.Provider value={{ userPhotoUri, setUserPhoto, removeUserPhoto, isLoading }}>
            {children}
        </UserPhotoContext.Provider>
    );
}

export function useUserPhoto() {
    const context = useContext(UserPhotoContext);
    if (context === undefined) {
        throw new Error('useUserPhoto must be used within a UserPhotoProvider');
    }
    return context;
}
