import { Garment } from './supabaseService';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';

export interface ChatMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    recommendations?: any[]; // OutfitRecommendation[] if present
}

export interface ConversationContext {
    occasion?: string;
    style?: string;
    preferences?: string;
    colors?: string[];
    season?: string;
    limit?: number;
}

/**
 * Start a new conversation with the fashion agent
 */
export async function startFashionAgentConversation(
    userGarments: Garment[]
): Promise<ChatMessage> {

    const wardrobeContext = buildWardrobeContext(userGarments);

    const initialMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'agent',
        content: `¡Hola! 👋 Soy tu asistente de moda personal.\n\nVi que tenés ${userGarments.length} prendas en tu guardarropa. ¿Para qué ocasión necesitás un outfit hoy?`,
        timestamp: new Date(),
    };

    return initialMessage;
}

/**
 * Send a message to the fashion agent and get response
 * Uses Gemini with function calling to decide when to generate recommendations
 */
export async function sendMessageToAgent(
    userMessage: string,
    conversationHistory: ChatMessage[],
    userGarments: Garment[]
): Promise<ChatMessage> {

    if (!API_KEY) {
        throw new Error('EXPO_PUBLIC_GOOGLE_API_KEY not configured');
    }

    console.log('💬 [FashionAgent] Sending message to Gemini...');

    // Build conversation history for Gemini
    const geminiHistory = conversationHistory.map(msg => ({
        role: msg.role === 'agent' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    // Add current user message
    geminiHistory.push({
        role: 'user',
        parts: [{ text: userMessage }]
    });

    // Define the function (tool) that Gemini can call
    const tools = [{
        functionDeclarations: [{
            name: 'generate_outfit_recommendations',
            description: 'Genera 3 recomendaciones de outfits personalizadas basadas en las preferencias del usuario. Llama a esta función cuando tengas suficiente información sobre la ocasión y estilo que el usuario necesita.',
            parameters: {
                type: 'object',
                properties: {
                    occasion: {
                        type: 'string',
                        description: 'La ocasión para la que el usuario necesita el outfit (ej: trabajo, casual, formal, deporte, cita)',
                    },
                    style: {
                        type: 'string',
                        description: 'El estilo preferido (ej: casual, formal, elegante, deportivo, minimalista)',
                    },
                    limit: {
                        type: 'integer',
                        description: 'Número de recomendaciones a generar. Por defecto es 3. Máximo 3. Si el usuario pide "un look" o "una opción", usa 1. Si pide "opciones" o no especifica, usa 3.',
                    },
                    preferences: {
                        type: 'string',
                        description: 'Cualquier otra preferencia específica del usuario (colores, clima, etc.)',
                    }
                },
                required: ['occasion']
            }
        }]
    }];

    const systemInstruction = `Eres un asistente de moda personal experto y amigable. Tu trabajo es:

1. Hacer preguntas breves y naturales para entender qué necesita el usuario
2. Cuando tengas suficiente información (ocasión y opcionalmente estilo), DEBES llamar a la función generate_outfit_recommendations UNA SOLA VEZ
3. Sé conversacional, amigable y conciso
4. No hagas más de 2-3 preguntas antes de generar recomendaciones
5. Si el usuario ya te dio suficiente información, llama a la función inmediatamente
6. IMPORTANTE: Después de generar recomendaciones, NO vuelvas a llamar a la función. Solo responde conversacionalmente.
7. Presta atención a la cantidad de looks que pide el usuario. Si pide "un look", pasa limit=1.

El usuario tiene ${userGarments.length} prendas en su guardarropa.`;

    try {
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'x-goog-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: geminiHistory,
                tools: tools,
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [FashionAgent] API Error:', errorText);
            throw new Error(`Gemini API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 [FashionAgent] Response:', JSON.stringify(data, null, 2));

        const candidate = data.candidates?.[0];

        // Check if Gemini called the function
        const functionCall = candidate?.content?.parts?.find((part: any) => part.functionCall);

        if (functionCall) {
            console.log('🔧 [FashionAgent] Function called:', functionCall.functionCall.name);
            console.log('📋 [FashionAgent] Parameters:', functionCall.functionCall.args);

            // Gemini decided to generate recommendations!
            const args = functionCall.functionCall.args;

            // Generate recommendations based on the context
            const recommendations = await generateContextualRecommendations(
                userGarments,
                args
            );

            // Return message with recommendations embedded
            return {
                id: Date.now().toString(),
                role: 'agent',
                content: `¡Perfecto! Basándome en lo que me contaste, te preparé ${recommendations.length} look${recommendations.length > 1 ? 's' : ''} ${args.style || ''} para ${args.occasion}:`,
                timestamp: new Date(),
                recommendations: recommendations,
            };
        }

        // Normal text response
        const textResponse = candidate?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error('No response from Gemini');
        }

        return {
            id: Date.now().toString(),
            role: 'agent',
            content: textResponse,
            timestamp: new Date(),
        };

    } catch (error: any) {
        console.error('❌ [FashionAgent] Error:', error);
        throw error;
    }
}

/**
 * Generate recommendations with context from conversation
 */
async function generateContextualRecommendations(
    userGarments: Garment[],
    context: ConversationContext
): Promise<any[]> {

    // Import the existing recommendation function
    const { getFashionRecommendations } = require('./fashionRecommendations');

    // For now, use the existing function
    // TODO: Enhance to use context (occasion, style, preferences)
    const userId = userGarments[0]?.user_id;

    if (!userId) {
        return [];
    }

    // Get limit from context or default to 3
    // Ensure limit is between 1 and 3
    let limit = 3;
    if (context.limit) {
        limit = Math.min(Math.max(parseInt(String(context.limit)), 1), 3);
    }

    const recommendations = await getFashionRecommendations(userId, limit);
    return recommendations;
}

/**
 * Build wardrobe context for the agent
 */
function buildWardrobeContext(garments: Garment[]): string {
    const uppers = garments.filter(g => g.category === 'upper');
    const lowers = garments.filter(g => g.category === 'lower');
    const footwear = garments.filter(g => g.category === 'footwear');

    return `Guardarropa: ${uppers.length} superiores, ${lowers.length} inferiores, ${footwear.length} calzado`;
}
