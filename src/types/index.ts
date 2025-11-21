export type GarmentType = 'upper_body' | 'lower_body' | 'footwear';

export type GarmentFit = 'tight' | 'slim' | 'regular' | 'loose' | 'oversize';

export interface Garment {
    id: string;
    name: string;
    image: any; // require() path
    type: GarmentType;
    description: string;
    fit: GarmentFit;
}

export interface Category {
    id: string;
    name: string;
}

export interface Outfit {
    id: string;
    image: string; // Base64 string
    date: string;
    model: 'gemini-3-pro' | 'gemini-2.5-flash';
    categoryId?: string;
    garments: {
        upper?: { type: string; description: string };
        lower?: { type: string; description: string };
        footwear?: { type: string; description: string };
    };
}

export interface User {
    id: string;
    name: string;
    image: any; // require() path
}

export interface TryOnResult {
    imageBase64: string;
    timestamp: number;
}
