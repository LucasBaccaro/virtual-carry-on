import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { Category } from '../types';

export interface SavedOutfit {
    id: string;
    imageBase64: string;
    timestamp: number;
    modelUsed: 'gemini-3-pro' | 'gemini-2.5-flash';
    categoryId?: string;
    garments: {
        upper?: {
            type: string;
            description: string;
        };
        lower?: {
            type: string;
            description: string;
        };
        footwear?: {
            type: string;
            description: string;
        };
    };
}

interface OutfitContextType {
    savedOutfits: SavedOutfit[];
    saveOutfit: (outfit: Omit<SavedOutfit, 'id' | 'timestamp'>) => Promise<void>;
    removeOutfit: (id: string) => Promise<void>;
    categories: Category[];
    addCategory: (name: string) => Promise<void>;
    removeCategory: (id: string) => Promise<void>;
    updateCategory: (id: string, name: string) => Promise<void>;
    isLoading: boolean;
}

const OutfitContext = createContext<OutfitContextType | undefined>(undefined);

const STORAGE_KEY = '@smartfit_saved_outfits';
const CATEGORIES_KEY = '@smartfit_categories';

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Work Outfits' },
    { id: '2', name: 'Summer Vacation' },
    { id: '3', name: 'Formal Events' },
    { id: '4', name: 'Weekend Casual' },
];

export function OutfitProvider({ children }: { children: ReactNode }) {
    const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [storedOutfits, storedCategories] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEY),
                AsyncStorage.getItem(CATEGORIES_KEY)
            ]);

            if (storedOutfits) {
                const outfits = JSON.parse(storedOutfits);
                setSavedOutfits(outfits);
            }

            if (storedCategories) {
                setCategories(JSON.parse(storedCategories));
            } else {
                // Initialize default categories
                setCategories(DEFAULT_CATEGORIES);
                await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Handle corruption if needed
            if (error instanceof Error && error.message.includes('Row too big')) {
                console.log('Clearing corrupted storage...');
                await AsyncStorage.removeItem(STORAGE_KEY);
                setSavedOutfits([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const compressImage = async (base64Image: string): Promise<string> => {
        try {
            // Convert base64 to URI
            const uri = `data:image/jpeg;base64,${base64Image}`;

            // Compress image to reduce size
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 800 } }], // Resize to max width 800px
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            return manipResult.base64 || base64Image;
        } catch (error) {
            console.error('Error compressing image:', error);
            // If compression fails, return original
            return base64Image;
        }
    };

    const saveOutfit = async (outfit: Omit<SavedOutfit, 'id' | 'timestamp'>) => {
        try {
            // Compress image before saving
            const compressedImage = await compressImage(outfit.imageBase64);

            const newOutfit: SavedOutfit = {
                ...outfit,
                imageBase64: compressedImage,
                id: Date.now().toString(),
                timestamp: Date.now(),
            };

            const updatedOutfits = [newOutfit, ...savedOutfits];
            setSavedOutfits(updatedOutfits);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOutfits));
        } catch (error) {
            console.error('Error saving outfit:', error);
            throw error;
        }
    };

    const removeOutfit = async (id: string) => {
        try {
            const updatedOutfits = savedOutfits.filter(outfit => outfit.id !== id);
            setSavedOutfits(updatedOutfits);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOutfits));
        } catch (error) {
            console.error('Error removing outfit:', error);
            throw error;
        }
    };

    const addCategory = async (name: string) => {
        try {
            const newCategory: Category = {
                id: Date.now().toString(),
                name,
            };
            const updatedCategories = [...categories, newCategory];
            setCategories(updatedCategories);
            await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCategories));
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    };

    const removeCategory = async (id: string) => {
        try {
            const updatedCategories = categories.filter(c => c.id !== id);
            setCategories(updatedCategories);
            await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCategories));
        } catch (error) {
            console.error('Error removing category:', error);
            throw error;
        }
    };

    const updateCategory = async (id: string, name: string) => {
        try {
            const updatedCategories = categories.map(c =>
                c.id === id ? { ...c, name } : c
            );
            setCategories(updatedCategories);
            await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCategories));
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    };

    return (
        <OutfitContext.Provider value={{
            savedOutfits,
            saveOutfit,
            removeOutfit,
            categories,
            addCategory,
            removeCategory,
            updateCategory,
            isLoading
        }}>
            {children}
        </OutfitContext.Provider>
    );
}

export function useOutfits() {
    const context = useContext(OutfitContext);
    if (context === undefined) {
        throw new Error('useOutfits must be used within an OutfitProvider');
    }
    return context;
}
