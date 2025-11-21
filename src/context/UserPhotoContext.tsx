import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getProfile, updateProfilePhoto } from '../services/supabaseService';

interface UserPhotoContextType {
    userPhotoUri: string | null;
    setUserPhoto: (uri: string) => Promise<void>;
    isLoading: boolean;
    isUploading: boolean;
}

const UserPhotoContext = createContext<UserPhotoContextType | undefined>(undefined);

export function UserPhotoProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [userPhotoUri, setUserPhotoUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Load user photo when user changes
    useEffect(() => {
        if (user) {
            loadUserPhoto();
        } else {
            setUserPhotoUri(null);
            setIsLoading(false);
        }
    }, [user]);

    const loadUserPhoto = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const { data, error } = await getProfile(user.id);

            if (error) {
                console.error('Error loading profile:', error);
                return;
            }

            if (data?.full_body_photo_url) {
                setUserPhotoUri(data.full_body_photo_url);
            }
        } catch (error) {
            console.error('Error loading user photo:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setUserPhoto = async (uri: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            setIsUploading(true);
            const { data, error } = await updateProfilePhoto(user.id, uri);

            if (error) throw error;

            if (data) {
                setUserPhotoUri(data);
            }
        } catch (error) {
            console.error('Error saving user photo:', error);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <UserPhotoContext.Provider
            value={{
                userPhotoUri,
                setUserPhoto,
                isLoading,
                isUploading,
            }}
        >
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
