import { supabase } from './supabase';
import { Garment } from './supabaseService';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';

export interface OutfitRecommendation {
    id: string;
    name: string;
    description: string;
    garments: {
        upperId: string;
        lowerId: string;
        footwearId: string;
    };
    reasoning: string;
    score: number; // 1-10
    occasion: string;
    season: string;
}

interface GeminiRecommendationResponse {
    name: string;
    description: string;
    upperRef: string; // e.g. "U1"
    lowerRef: string; // e.g. "L2"
    footwearRef: string; // e.g. "F1"
    reasoning: string;
    score: number;
    occasion: string;
    season: string;
}

/**
 * Get fashion recommendations from Gemini AI
 * Analyzes user's entire wardrobe and suggests complete outfits
 */
export async function getFashionRecommendations(
    userId: string,
    limit: number = 3 // Changed from 5 to 3
): Promise<OutfitRecommendation[]> {

    console.log('👔 [getFashionRecommendations] Loading user wardrobe...');

    // 1. Load ALL user garments with metadata
    const { data: garments, error } = await supabase
        .from('garments')
        .select('*')
        .eq('user_id', userId);

    if (error || !garments || garments.length === 0) {
        console.warn('⚠️ [getFashionRecommendations] No garments found');
        return [];
    }

    console.log(`📦 [getFashionRecommendations] Loaded ${garments.length} garments`);

    // 2. Separate by category
    const uppers = garments.filter(g => g.category === 'upper');
    const lowers = garments.filter(g => g.category === 'lower');
    const footwear = garments.filter(g => g.category === 'footwear');

    console.log(`👕 Uppers: ${uppers.length}, 👖 Lowers: ${lowers.length}, 👟 Footwear: ${footwear.length}`);

    if (uppers.length === 0 || lowers.length === 0 || footwear.length === 0) {
        console.warn('⚠️ [getFashionRecommendations] Missing garments in some categories');
        return [];
    }

    // 3. Build prompt for Gemini
    const prompt = buildFashionDesignerPrompt(uppers, lowers, footwear, limit);

    // 4. Call Gemini for recommendations
    const recommendations = await callGeminiForRecommendations(
        prompt,
        uppers,
        lowers,
        footwear
    );

    console.log(`✅ [getFashionRecommendations] Generated ${recommendations.length} recommendations`);

    return recommendations;
}

/**
 * Build prompt for Gemini as a fashion designer
 */
function buildFashionDesignerPrompt(
    uppers: Garment[],
    lowers: Garment[],
    footwear: Garment[],
    limit: number
): string {

    // Serialize garments with metadata
    const uppersInfo = uppers.map((g, i) => {
        const meta = g.metadata || {};
        return `[U${i + 1}] ${g.type}: ${g.description}
     - Colores: ${meta.colors?.join(', ') || 'desconocido'}
     - Estilo: ${meta.style || 'desconocido'}
     - Ocasión: ${meta.occasion?.join(', ') || 'desconocido'}
     - Temporada: ${meta.season?.join(', ') || 'todo el año'}
     - Patrón: ${meta.pattern || 'desconocido'}`;
    }).join('\n\n');

    const lowersInfo = lowers.map((g, i) => {
        const meta = g.metadata || {};
        return `[L${i + 1}] ${g.type}: ${g.description}
     - Colores: ${meta.colors?.join(', ') || 'desconocido'}
     - Estilo: ${meta.style || 'desconocido'}
     - Ocasión: ${meta.occasion?.join(', ') || 'desconocido'}
     - Temporada: ${meta.season?.join(', ') || 'todo el año'}
     - Patrón: ${meta.pattern || 'desconocido'}`;
    }).join('\n\n');

    const footwearInfo = footwear.map((g, i) => {
        const meta = g.metadata || {};
        return `[F${i + 1}] ${g.type}: ${g.description}
     - Colores: ${meta.colors?.join(', ') || 'desconocido'}
     - Estilo: ${meta.style || 'desconocido'}
     - Ocasión: ${meta.occasion?.join(', ') || 'desconocido'}`;
    }).join('\n\n');

    // Ultra-simplified prompt to minimize thinking mode
    return `Recomienda ${limit} outfits DIFERENTES combinando estas prendas:

SUPERIORES: ${uppers.map((g, i) => `[U${i + 1}] ${g.type} ${g.metadata?.primaryColor || ''}`).join(', ')}
INFERIORES: ${lowers.map((g, i) => `[L${i + 1}] ${g.type} ${g.metadata?.primaryColor || ''}`).join(', ')}
CALZADO: ${footwear.map((g, i) => `[F${i + 1}] ${g.type} ${g.metadata?.primaryColor || ''}`).join(', ')}

IMPORTANTE: Cada outfit debe usar DIFERENTES combinaciones de prendas. NO repitas la misma combinación.
Genera EXACTAMENTE ${limit} recomendaciones.

Responde SOLO con JSON:
[{"name":"Look Casual","description":"Para el día","upperRef":"U1","lowerRef":"L1","footwearRef":"F1","reasoning":"Combina bien","score":8,"occasion":"diario","season":"primavera"}]`;
}

/**
 * Call Gemini API for recommendations
 */
async function callGeminiForRecommendations(
    prompt: string,
    uppers: Garment[],
    lowers: Garment[],
    footwear: Garment[]
): Promise<OutfitRecommendation[]> {

    if (!API_KEY) {
        throw new Error('EXPO_PUBLIC_GOOGLE_API_KEY not configured');
    }

    console.log('🤖 [callGeminiForRecommendations] Calling Gemini API...');

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'x-goog-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7, // Lower for more consistent output
                    maxOutputTokens: 8192, // Very high to handle thinking mode
                    responseModalities: ["TEXT"], // Disable thinking mode
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [callGeminiForRecommendations] API Error:', errorText);
            throw new Error(`Gemini API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 [callGeminiForRecommendations] Full response:', JSON.stringify(data, null, 2));

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            console.error('❌ [callGeminiForRecommendations] No text in response');
            console.error('Finish reason:', data.candidates?.[0]?.finishReason);
            throw new Error('No response from Gemini');
        }

        console.log('📊 [callGeminiForRecommendations] Raw response:', textResponse.substring(0, 200));

        // Clean response (remove markdown if present)
        let cleanedResponse = textResponse.trim();
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
        }

        // Parse JSON response
        const geminiRecs: GeminiRecommendationResponse[] = JSON.parse(cleanedResponse);

        // Convert references (U1, L2, F1) to actual garment IDs
        const recommendations: OutfitRecommendation[] = geminiRecs.map((rec, index) => {
            const upperId = parseGarmentReference(rec.upperRef, uppers);
            const lowerId = parseGarmentReference(rec.lowerRef, lowers);
            const footwearId = parseGarmentReference(rec.footwearRef, footwear);

            // Clean reasoning text - remove references like (U1), [L2], etc.
            const cleanReasoning = rec.reasoning
                .replace(/\[?[ULF]\d+\]?/g, '') // Remove [U1], L2, F1, etc.
                .replace(/\s+/g, ' ') // Clean up extra spaces
                .trim();

            return {
                id: `${upperId}-${lowerId}-${footwearId}-${index}`, // Added index for uniqueness
                name: rec.name,
                description: rec.description,
                garments: {
                    upperId,
                    lowerId,
                    footwearId,
                },
                reasoning: cleanReasoning,
                score: rec.score,
                occasion: rec.occasion,
                season: rec.season,
            };
        });

        return recommendations;

    } catch (error: any) {
        console.error('❌ [callGeminiForRecommendations] Error:', error);
        throw error;
    }
}

/**
 * Parse garment reference (e.g. "U1") to actual garment ID
 */
function parseGarmentReference(ref: string, garments: Garment[]): string {
    // Extract number from reference (e.g. "U1" -> 1)
    const match = ref.match(/\d+/);
    if (!match) {
        console.warn(`⚠️ Invalid reference: ${ref}`);
        return garments[0]?.id || '';
    }

    const index = parseInt(match[0]) - 1; // Convert to 0-based index

    if (index < 0 || index >= garments.length) {
        console.warn(`⚠️ Reference out of bounds: ${ref}`);
        return garments[0]?.id || '';
    }

    return garments[index].id;
}

/**
 * Get garment by ID (helper for UI)
 */
export async function getGarmentById(garmentId: string): Promise<Garment | null> {
    const { data, error } = await supabase
        .from('garments')
        .select('*')
        .eq('id', garmentId)
        .single();

    if (error) {
        console.error('❌ [getGarmentById] Error:', error);
        return null;
    }

    return data;
}
