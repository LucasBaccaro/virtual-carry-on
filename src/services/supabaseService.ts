import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface Profile {
    id: string;
    full_body_photo_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Garment {
    id: string;
    user_id: string;
    category: 'upper' | 'lower' | 'footwear';
    type: string;
    description: string;
    image_url: string;
    created_at: string;
}

export interface OutfitCategory {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface SavedOutfit {
    id: string;
    user_id: string;
    image_url: string;
    model_used: 'gemini-3-pro' | 'gemini-2.5-flash';
    category_id: string | null;
    garment_ids: string[];
    created_at: string;
}

// ============================================
// PROFILE OPERATIONS
// ============================================

export const getProfile = async (userId: string): Promise<{ data: Profile | null; error: any }> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    return { data, error };
};

export const updateProfilePhoto = async (
    userId: string,
    photoUri: string
): Promise<{ data: string | null; error: any }> => {
    try {
        // Delete old photo if exists
        const { data: profile } = await getProfile(userId);
        if (profile?.full_body_photo_url) {
            const oldPath = profile.full_body_photo_url.split('/').pop();
            if (oldPath) {
                await supabase.storage
                    .from('profile-photos')
                    .remove([`${userId}/${oldPath}`]);
            }
        }

        // Upload new photo
        const fileExt = photoUri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(photoUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(filePath, decode(base64), {
                contentType: `image/${fileExt}`,
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(filePath);

        // Update profile record
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                full_body_photo_url: publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        return { data: publicUrl, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// ============================================
// GARMENT OPERATIONS
// ============================================

export const getGarments = async (
    userId: string,
    category?: 'upper' | 'lower' | 'footwear'
): Promise<{ data: Garment[] | null; error: any }> => {
    let query = supabase
        .from('garments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    return { data, error };
};

export const createGarment = async (
    userId: string,
    category: 'upper' | 'lower' | 'footwear',
    type: string,
    description: string,
    imageUri: string
): Promise<{ data: Garment | null; error: any }> => {
    try {
        // Upload image
        const fileExt = imageUri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${category}/${fileName}`;

        const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const { error: uploadError } = await supabase.storage
            .from('garment-images')
            .upload(filePath, decode(base64), {
                contentType: `image/${fileExt}`,
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('garment-images')
            .getPublicUrl(filePath);

        // Create garment record
        const { data, error } = await supabase
            .from('garments')
            .insert({
                user_id: userId,
                category,
                type,
                description,
                image_url: publicUrl,
            })
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const deleteGarment = async (
    garmentId: string,
    imageUrl: string
): Promise<{ error: any }> => {
    try {
        // Extract path from URL
        const urlParts = imageUrl.split('/');
        const bucketIndex = urlParts.indexOf('garment-images');
        const filePath = urlParts.slice(bucketIndex + 1).join('/');

        // Delete from storage
        await supabase.storage
            .from('garment-images')
            .remove([filePath]);

        // Delete from database
        const { error } = await supabase
            .from('garments')
            .delete()
            .eq('id', garmentId);

        return { error };
    } catch (error) {
        return { error };
    }
};

// ============================================
// CATEGORY OPERATIONS
// ============================================

export const getCategories = async (
    userId: string
): Promise<{ data: OutfitCategory[] | null; error: any }> => {
    const { data, error } = await supabase
        .from('outfit_categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    return { data, error };
};

export const createCategory = async (
    userId: string,
    name: string
): Promise<{ data: OutfitCategory | null; error: any }> => {
    const { data, error } = await supabase
        .from('outfit_categories')
        .insert({
            user_id: userId,
            name,
        })
        .select()
        .single();

    return { data, error };
};

export const updateCategory = async (
    categoryId: string,
    name: string
): Promise<{ error: any }> => {
    const { error } = await supabase
        .from('outfit_categories')
        .update({
            name,
            updated_at: new Date().toISOString()
        })
        .eq('id', categoryId);

    return { error };
};

export const deleteCategory = async (categoryId: string): Promise<{ error: any }> => {
    const { error } = await supabase
        .from('outfit_categories')
        .delete()
        .eq('id', categoryId);

    return { error };
};

// ============================================
// OUTFIT OPERATIONS
// ============================================

export const getOutfits = async (
    userId: string,
    categoryId?: string
): Promise<{ data: SavedOutfit[] | null; error: any }> => {
    let query = supabase
        .from('saved_outfits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (categoryId) {
        query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    return { data, error };
};

export const saveOutfit = async (
    userId: string,
    imageBase64: string,
    modelUsed: 'gemini-3-pro' | 'gemini-2.5-flash',
    garmentIds: string[],
    categoryId?: string
): Promise<{ data: SavedOutfit | null; error: any }> => {
    try {
        // Upload image
        const fileName = `${Date.now()}.jpg`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('generated-outfits')
            .upload(filePath, decode(imageBase64), {
                contentType: 'image/jpeg',
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('generated-outfits')
            .getPublicUrl(filePath);

        // Create outfit record
        const { data, error } = await supabase
            .from('saved_outfits')
            .insert({
                user_id: userId,
                image_url: publicUrl,
                model_used: modelUsed,
                garment_ids: garmentIds,
                category_id: categoryId || null,
            })
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const deleteOutfit = async (
    outfitId: string,
    imageUrl: string
): Promise<{ error: any }> => {
    try {
        // Extract path from URL
        const urlParts = imageUrl.split('/');
        const bucketIndex = urlParts.indexOf('generated-outfits');
        const filePath = urlParts.slice(bucketIndex + 1).join('/');

        // Delete from storage
        await supabase.storage
            .from('generated-outfits')
            .remove([filePath]);

        // Delete from database
        const { error } = await supabase
            .from('saved_outfits')
            .delete()
            .eq('id', outfitId);

        return { error };
    } catch (error) {
        return { error };
    }
};
