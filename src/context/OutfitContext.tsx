import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from './AuthContext';
import {
    getCategories,
    createCategory,
    updateCategory as updateCategoryService,
    deleteCategory,
    getOutfits,
    saveOutfit as saveOutfitService,
    deleteOutfit,
    OutfitCategory,
    SavedOutfit as SupabaseOutfit,
} from '../services/supabaseService';

export interface SavedOutfit {
    id: string;
    imageUrl: string;
    timestamp: string;
    modelUsed: 'gemini-3-pro' | 'gemini-2.5-flash';
    categoryId?: string;
    garmentIds: string[];
}

export interface Category {
    id: string;
    name: string;
}

interface OutfitContextType {
    savedOutfits: SavedOutfit[];
    saveOutfit: (outfit: {
        imageBase64: string;
        modelUsed: 'gemini-3-pro' | 'gemini-2.5-flash';
        garmentIds: string[];
        categoryId?: string;
    }) => Promise<void>;
    removeOutfit: (id: string, imageUrl: string) => Promise<void>;
    categories: Category[];
    addCategory: (name: string) => Promise<void>;
    removeCategory: (id: string) => Promise<void>;
    updateCategory: (id: string, name: string) => Promise<void>;
    isLoading: boolean;
    isRefreshing: boolean;
    refreshOutfits: () => Promise<void>;
    refreshCategories: () => Promise<void>;
}

const OutfitContext = createContext<OutfitContextType | undefined>(undefined);

export function OutfitProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load data when user changes
    useEffect(() => {
        if (user) {
            loadData();
        } else {
            // Clear data when user logs out
            setSavedOutfits([]);
            setCategories([]);
            setIsLoading(false);
        }
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const [outfitsResult, categoriesResult] = await Promise.all([
                getOutfits(user.id),
                getCategories(user.id),
            ]);

            if (outfitsResult.data) {
                const formattedOutfits: SavedOutfit[] = outfitsResult.data.map((outfit) => ({
                    id: outfit.id,
                    imageUrl: outfit.image_url,
                    timestamp: outfit.created_at,
                    modelUsed: outfit.model_used,
                    categoryId: outfit.category_id || undefined,
                    garmentIds: outfit.garment_ids || [],
                }));
                setSavedOutfits(formattedOutfits);
            }

            if (categoriesResult.data) {
                const formattedCategories: Category[] = categoriesResult.data.map((cat) => ({
                    id: cat.id,
                    name: cat.name,
                }));
                setCategories(formattedCategories);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshOutfits = async () => {
        if (!user) return;

        try {
            setIsRefreshing(true);
            const result = await getOutfits(user.id);

            if (result.data) {
                const formattedOutfits: SavedOutfit[] = result.data.map((outfit) => ({
                    id: outfit.id,
                    imageUrl: outfit.image_url,
                    timestamp: outfit.created_at,
                    modelUsed: outfit.model_used,
                    categoryId: outfit.category_id || undefined,
                    garmentIds: outfit.garment_ids || [],
                }));
                setSavedOutfits(formattedOutfits);
            }
        } catch (error) {
            console.error('Error refreshing outfits:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const refreshCategories = async () => {
        if (!user) return;

        try {
            setIsRefreshing(true);
            const result = await getCategories(user.id);

            if (result.data) {
                const formattedCategories: Category[] = result.data.map((cat) => ({
                    id: cat.id,
                    name: cat.name,
                }));
                setCategories(formattedCategories);
            }
        } catch (error) {
            console.error('Error refreshing categories:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const compressImage = async (base64Image: string): Promise<string> => {
        try {
            const uri = `data:image/jpeg;base64,${base64Image}`;

            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 800 } }],
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            return manipResult.base64 || base64Image;
        } catch (error) {
            console.error('Error compressing image:', error);
            return base64Image;
        }
    };

    const saveOutfit = async (outfit: {
        imageBase64: string;
        modelUsed: 'gemini-3-pro' | 'gemini-2.5-flash';
        garmentIds: string[];
        categoryId?: string;
    }) => {
        if (!user) throw new Error('User not authenticated');

        try {
            // Compress image before uploading
            const compressedImage = await compressImage(outfit.imageBase64);

            const { data, error } = await saveOutfitService(
                user.id,
                compressedImage,
                outfit.modelUsed,
                outfit.garmentIds,
                outfit.categoryId
            );

            if (error) throw error;

            if (data) {
                const newOutfit: SavedOutfit = {
                    id: data.id,
                    imageUrl: data.image_url,
                    timestamp: data.created_at,
                    modelUsed: data.model_used,
                    categoryId: data.category_id || undefined,
                    garmentIds: data.garment_ids || [],
                };
                setSavedOutfits([newOutfit, ...savedOutfits]);
            }
        } catch (error) {
            console.error('Error saving outfit:', error);
            throw error;
        }
    };

    const removeOutfit = async (id: string, imageUrl: string) => {
        try {
            const { error } = await deleteOutfit(id, imageUrl);
            if (error) throw error;

            setSavedOutfits(savedOutfits.filter((outfit) => outfit.id !== id));
        } catch (error) {
            console.error('Error removing outfit:', error);
            throw error;
        }
    };

    const addCategory = async (name: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { data, error } = await createCategory(user.id, name);
            if (error) throw error;

            if (data) {
                const newCategory: Category = {
                    id: data.id,
                    name: data.name,
                };
                setCategories([...categories, newCategory]);
            }
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    };

    const removeCategory = async (id: string) => {
        try {
            const { error } = await deleteCategory(id);
            if (error) throw error;

            setCategories(categories.filter((c) => c.id !== id));
        } catch (error) {
            console.error('Error removing category:', error);
            throw error;
        }
    };

    const updateCategory = async (id: string, name: string) => {
        try {
            const { error } = await updateCategoryService(id, name);
            if (error) throw error;

            setCategories(categories.map((c) => (c.id === id ? { ...c, name } : c)));
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    };

    return (
        <OutfitContext.Provider
            value={{
                savedOutfits,
                saveOutfit,
                removeOutfit,
                categories,
                addCategory,
                removeCategory,
                updateCategory,
                isLoading,
                isRefreshing,
                refreshOutfits,
                refreshCategories,
            }}
        >
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
