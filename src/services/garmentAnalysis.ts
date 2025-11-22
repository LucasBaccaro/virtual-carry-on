import * as FileSystem from 'expo-file-system/legacy';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';

export interface GarmentMetadata {
    colors: string[];
    primaryColor: string;
    style: string;
    occasion: string[];
    season: string[];
    pattern: string;
    material: string;
    formality: 'casual' | 'formal' | 'sport';
    versatility: number; // 1-10
}

export interface AIAnalysis {
    detailedDescription: string;
    suggestedPairings: string[];
    formality: 'casual' | 'formal' | 'sport';
    versatility: number; // 1-10
    analyzedAt: string;
}

export interface GarmentAnalysisResult {
    metadata: GarmentMetadata;
    aiAnalysis: AIAnalysis;
}

/**
 * Analyze a garment image with Gemini AI to extract metadata
 * Uses Gemini 1.5 Flash for fast, cost-effective analysis
 */
export async function analyzeGarmentWithAI(
    imageBase64: string,
    category: string,
    type: string,
    description: string
): Promise<GarmentAnalysisResult> {

    if (!API_KEY) {
        throw new Error('EXPO_PUBLIC_GOOGLE_API_KEY not configured');
    }

    console.log('🎨 [analyzeGarmentWithAI] Analyzing garment...');
    console.log('📝 Category:', category, '| Type:', type);

    // Ultra-simplified prompt to minimize thinking mode
    const prompt = `Analiza esta ${category} y responde SOLO con JSON:
{"metadata":{"colors":["color"],"primaryColor":"color","style":"casual","occasion":["diario"],"season":["primavera"],"pattern":"liso","material":"algodón","formality":"casual","versatility":5},"aiAnalysis":{"detailedDescription":"descripción breve","suggestedPairings":["prenda1","prenda2"],"formality":"casual","versatility":5}}`;

    try {
        // Use fetch API exactly as shown in official Gemini documentation
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

        console.log('📤 [analyzeGarmentWithAI] Sending request to Gemini 2.5 Flash...');

        const requestBody = {
            contents: [{
                parts: [
                    {
                        inline_data: {
                            mime_type: 'image/jpeg',
                            data: imageBase64,
                        }
                    },
                    { text: prompt }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 4096, // Increased to handle thinking mode overhead
                responseModalities: ["TEXT"], // Disable thinking mode
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'x-goog-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [analyzeGarmentWithAI] API Error:', errorText);
            throw new Error(`Gemini API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 [analyzeGarmentWithAI] Full response:', JSON.stringify(data, null, 2));

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            console.error('❌ [analyzeGarmentWithAI] No text in response');
            console.error('Candidates:', JSON.stringify(data.candidates, null, 2));
            console.error('Finish reason:', data.candidates?.[0]?.finishReason);
            throw new Error('No response from Gemini');
        }

        console.log('📊 [analyzeGarmentWithAI] Raw response:', textResponse.substring(0, 200));

        // Clean response (remove markdown if present)
        let cleanedResponse = textResponse.trim();
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
        }

        // Parse JSON response
        const parsed = JSON.parse(cleanedResponse);

        // Add timestamp to AI analysis
        const analysisResult: GarmentAnalysisResult = {
            metadata: parsed.metadata,
            aiAnalysis: {
                ...parsed.aiAnalysis,
                analyzedAt: new Date().toISOString(),
            }
        };

        console.log('✅ [analyzeGarmentWithAI] Analysis complete');
        console.log('🎨 Primary color:', analysisResult.metadata.primaryColor);
        console.log('👔 Style:', analysisResult.metadata.style);
        console.log('⭐ Versatility:', analysisResult.metadata.versatility);

        return analysisResult;

    } catch (error: any) {
        console.error('❌ [analyzeGarmentWithAI] Error:', error);

        // Return default metadata if analysis fails
        console.warn('⚠️ [analyzeGarmentWithAI] Returning default metadata due to error');

        return {
            metadata: {
                colors: ['desconocido'],
                primaryColor: 'desconocido',
                style: 'casual',
                occasion: ['diario'],
                season: ['todo el año'],
                pattern: 'liso',
                material: 'otro',
                formality: 'casual',
                versatility: 5,
            },
            aiAnalysis: {
                detailedDescription: description || 'Prenda sin descripción detallada',
                suggestedPairings: [],
                formality: 'casual',
                versatility: 5,
                analyzedAt: new Date().toISOString(),
            }
        };
    }
}

/**
 * Analyze garment from URI (reads file and converts to base64)
 */
export async function analyzeGarmentFromUri(
    imageUri: string,
    category: string,
    type: string,
    description: string
): Promise<GarmentAnalysisResult> {

    console.log('📸 [analyzeGarmentFromUri] Reading image from URI...');

    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
    });

    return analyzeGarmentWithAI(base64, category, type, description);
}
