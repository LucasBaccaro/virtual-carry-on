export type GarmentType = 'upper' | 'lower' | 'footwear' | 'one-piece';

export type GarmentFit = 'tight' | 'slim' | 'regular' | 'loose' | 'oversize';

export interface Garment {
    id: string;
    user_id: string;
    category: GarmentType;
    type: string;
    description: string;
    image_url: string;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
}

export interface SavedOutfit {
    id: string;
    imageUrl: string;
    timestamp: string;
    modelUsed: 'gemini-3-pro' | 'gemini-2.5-flash';
    categoryId?: string;
    garmentIds: string[];
}

export interface User {
    id: string;
    email: string;
    full_body_photo_url?: string;
}

export interface TryOnResult {
    success: boolean;
    imageBase64?: string;
    error?: string;
}
