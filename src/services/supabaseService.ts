import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { removeBackground } from './gemini';

export interface Profile {
    id: string;
    full_body_photo_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Garment {
    id: string;
    user_id: string;
    category: 'upper' | 'lower' | 'footwear' | 'one-piece';
    type: string;
    description: string;
    image_url: string;
    metadata?: {
        colors: string[];
        primaryColor: string;
        style: string;
        occasion: string[];
        season: string[];
        pattern: string;
        material: string;
        formality: 'casual' | 'formal' | 'sport';
        versatility: number;
    };
    ai_analysis?: {
        detailedDescription: string;
        suggestedPairings: string[];
        formality: 'casual' | 'formal' | 'sport';
        versatility: number;
        analyzedAt: string;
    };
    usage_count?: number;
    last_used_at?: string;
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
        .maybeSingle();

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
            encoding: 'base64',
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
    category?: 'upper' | 'lower' | 'footwear' | 'one-piece'
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

// NEW: Process garment image (remove background + AI analysis) WITHOUT saving to DB
export const processGarmentImage = async (
    imageUri: string,
    category: 'upper' | 'lower' | 'footwear' | 'one-piece',
    type: string,
    description: string
): Promise<{
    success: boolean;
    imageBase64?: string;
    metadata?: any;
    aiAnalysis?: any;
    error?: any;
}> => {
    try {
        console.log('🔵 [processGarmentImage] Iniciando procesamiento de imagen...');

        // STEP 1: Remove background using Gemini AI
        console.log('🎨 [processGarmentImage] Removiendo fondo con Gemini AI...');
        const bgRemovalResult = await removeBackground(imageUri);

        let base64: string;

        if (bgRemovalResult.success && bgRemovalResult.imageBase64) {
            console.log('✅ [processGarmentImage] Fondo removido exitosamente');
            base64 = bgRemovalResult.imageBase64;
        } else {
            console.warn('⚠️ [processGarmentImage] No se pudo remover el fondo, usando imagen original');
            console.warn('Error:', bgRemovalResult.error);

            // Fallback: use original image
            console.log('🖼️ [processGarmentImage] Leyendo imagen original como base64...');
            base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64',
            });
        }

        // STEP 2: Analyze garment with AI to extract metadata
        console.log('🤖 [processGarmentImage] Analizando prenda con IA...');
        let metadata = {};
        let aiAnalysis = {};

        try {
            const { analyzeGarmentWithAI } = await import('./garmentAnalysis');
            const analysis = await analyzeGarmentWithAI(base64, category, type, description);
            metadata = analysis.metadata;
            aiAnalysis = analysis.aiAnalysis;
            console.log('✅ [processGarmentImage] Análisis IA completado');
        } catch (analysisError) {
            console.warn('⚠️ [processGarmentImage] Error en análisis IA, continuando sin metadata:', analysisError);
        }

        console.log('✅ [processGarmentImage] Procesamiento completado exitosamente');
        return {
            success: true,
            imageBase64: base64,
            metadata,
            aiAnalysis,
        };
    } catch (error) {
        console.error('❌ [processGarmentImage] ERROR GENERAL:');
        console.error('Error completo:', error);
        return {
            success: false,
            error,
        };
    }
};

// NEW: Save processed garment to database
export const saveProcessedGarment = async (
    userId: string,
    category: 'upper' | 'lower' | 'footwear' | 'one-piece',
    type: string,
    description: string,
    imageBase64: string,
    metadata: any = {},
    aiAnalysis: any = {}
): Promise<{ data: Garment | null; error: any }> => {
    try {
        console.log('🔵 [saveProcessedGarment] Guardando prenda procesada...');

        // Upload to Supabase Storage
        const fileExt = 'jpg';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${category}/${fileName}`;

        console.log('☁️ [saveProcessedGarment] Subiendo a Supabase Storage...');
        const { error: uploadError } = await supabase.storage
            .from('garment-images')
            .upload(filePath, decode(imageBase64), {
                contentType: `image/${fileExt}`,
            });

        if (uploadError) {
            console.error('❌ [saveProcessedGarment] ERROR AL SUBIR IMAGEN:');
            console.error('Error:', uploadError);
            throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('garment-images')
            .getPublicUrl(filePath);

        console.log('🔗 [saveProcessedGarment] URL pública:', publicUrl);

        // Insert into database
        console.log('💾 [saveProcessedGarment] Insertando en base de datos...');
        const { data, error } = await supabase
            .from('garments')
            .insert({
                user_id: userId,
                category,
                type,
                description,
                image_url: publicUrl,
                metadata,
                ai_analysis: aiAnalysis,
                usage_count: 0,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ [saveProcessedGarment] ERROR AL INSERTAR:');
            console.error('Error:', error);
            return { data: null, error };
        }

        console.log('✅ [saveProcessedGarment] Prenda guardada exitosamente');
        return { data, error: null };
    } catch (error) {
        console.error('❌ [saveProcessedGarment] ERROR GENERAL:', error);
        return { data: null, error };
    }
};

export const createGarment = async (
    userId: string,
    category: 'upper' | 'lower' | 'footwear' | 'one-piece',
    type: string,
    description: string,
    imageUri: string
): Promise<{ data: Garment | null; error: any }> => {
    try {
        console.log('🔵 [createGarment] Iniciando subida de prenda...');
        console.log('📝 [createGarment] Parámetros:', { userId, category, type, description, imageUri: imageUri.substring(0, 50) + '...' });

        // STEP 1: Remove background using Gemini AI
        console.log('🎨 [createGarment] Removiendo fondo con Gemini AI...');
        const bgRemovalResult = await removeBackground(imageUri);

        let base64: string;

        if (bgRemovalResult.success && bgRemovalResult.imageBase64) {
            console.log('✅ [createGarment] Fondo removido exitosamente');
            console.log('📊 [createGarment] Usando imagen con fondo blanco');
            base64 = bgRemovalResult.imageBase64;
        } else {
            console.warn('⚠️ [createGarment] No se pudo remover el fondo, usando imagen original');
            console.warn('Error:', bgRemovalResult.error);

            // Fallback: use original image
            console.log('🖼️ [createGarment] Leyendo imagen original como base64...');
            base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64',
            });
        }

        // STEP 2: Upload to Supabase
        const fileExt = 'jpg'; // Always save as JPG
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${category}/${fileName}`;

        console.log('📁 [createGarment] Ruta de archivo:', filePath);
        console.log('✅ [createGarment] Imagen preparada, tamaño base64:', base64.length, 'caracteres');
        console.log('☁️ [createGarment] Subiendo a Supabase Storage bucket: garment-images...');

        const { error: uploadError } = await supabase.storage
            .from('garment-images')
            .upload(filePath, decode(base64), {
                contentType: `image/${fileExt}`,
            });

        if (uploadError) {
            console.error('❌ [createGarment] ERROR AL SUBIR IMAGEN A STORAGE:');
            console.error('Error completo:', JSON.stringify(uploadError, null, 2));
            console.error('Mensaje:', uploadError.message);
            console.error('Status:', uploadError.statusCode);
            throw uploadError;
        }

        console.log('✅ [createGarment] Imagen subida exitosamente a Storage');

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('garment-images')
            .getPublicUrl(filePath);

        console.log('🔗 [createGarment] URL pública generada:', publicUrl);

        // STEP 3: Analyze garment with AI to extract metadata
        console.log('🤖 [createGarment] Analizando prenda con IA...');
        let metadata = {};
        let aiAnalysis = {};

        try {
            const { analyzeGarmentWithAI } = await import('./garmentAnalysis');
            const analysis = await analyzeGarmentWithAI(base64, category, type, description);
            metadata = analysis.metadata;
            aiAnalysis = analysis.aiAnalysis;
            console.log('✅ [createGarment] Análisis IA completado');
        } catch (analysisError) {
            console.warn('⚠️ [createGarment] Error en análisis IA, continuando sin metadata:', analysisError);
        }

        console.log('💾 [createGarment] Insertando registro en base de datos...');

        // Create garment record with metadata
        const { data, error } = await supabase
            .from('garments')
            .insert({
                user_id: userId,
                category,
                type,
                description,
                image_url: publicUrl,
                metadata,
                ai_analysis: aiAnalysis,
                usage_count: 0,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ [createGarment] ERROR AL INSERTAR EN BASE DE DATOS:');
            console.error('Error completo:', JSON.stringify(error, null, 2));
            console.error('Mensaje:', error.message);
            console.error('Code:', error.code);
            return { data: null, error };
        }

        console.log('✅ [createGarment] Prenda creada exitosamente:', data);
        return { data, error };
    } catch (error) {
        console.error('❌ [createGarment] ERROR GENERAL:');
        console.error('Error completo:', error);
        if (error instanceof Error) {
            console.error('Error.message:', error.message);
            console.error('Error.stack:', error.stack);
        }
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
