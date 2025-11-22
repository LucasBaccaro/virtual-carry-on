import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';

if (!API_KEY) {
    console.warn('⚠️ EXPO_PUBLIC_GOOGLE_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Convert a local image asset to base64 string
 */
async function imageToBase64(imageSource: any): Promise<string> {
    try {
        const asset = Asset.fromModule(imageSource);
        await asset.downloadAsync();

        if (!asset.localUri) {
            throw new Error('Failed to load asset');
        }

        // Read as base64
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
            encoding: 'base64',
        });

        return base64;
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw error;
    }
}

/**
 * Build the prompt for virtual try-on with support for 1-3 garments
 */
function buildTryOnPrompt(params: {
    upperGarment?: { type: string; description: string; fit: string };
    lowerGarment?: { type: string; description: string; fit: string };
    footwear?: { type: string; description: string; fit: string };
    onePiece?: { type: string; description: string; fit: string };
}): string {
    const { upperGarment, lowerGarment, footwear, onePiece } = params;

    // Build garment descriptions
    let garmentInstructions = 'PRENDAS A COLOCAR:\n';
    let imageIndex = 2; // User is image 1
    const garmentParts: string[] = [];

    if (onePiece) {
        garmentParts.push(`- PRENDA DE CUERPO COMPLETO (de la Imagen ${imageIndex}): ${onePiece.description}
  - Ajuste: ${onePiece.fit}
  - Ubicación: Cuerpo completo (Torso y Piernas)
  - NOTA: Esta prenda reemplaza cualquier prenda superior e inferior existente.`);
        imageIndex++;
    } else {
        if (upperGarment) {
            garmentParts.push(`- PRENDA SUPERIOR (de la Imagen ${imageIndex}): ${upperGarment.description}
      - Ajuste: ${upperGarment.fit}
      - Ubicación: Torso y brazos`);
            imageIndex++;
        }

        if (lowerGarment) {
            garmentParts.push(`- PRENDA INFERIOR (de la Imagen ${imageIndex}): ${lowerGarment.description}
      - Ajuste: ${lowerGarment.fit}
      - Ubicación: Piernas`);
            imageIndex++;
        }
    }

    if (footwear) {
        garmentParts.push(`- CALZADO (de la Imagen ${imageIndex}): ${footwear.description}
  - Ajuste: ${footwear.fit}
  - Ubicación: Pies`);
    }

    garmentInstructions += garmentParts.join('\n\n');

    return `Actúa como un fotógrafo de moda profesional y editor experto especializado en virtual try-on.

TAREA: Crea una imagen fotorrealista de la persona en la [Imagen 1] vistiendo las prendas especificadas.

${garmentInstructions}

REQUISITOS CRÍTICOS - ORDEN DE PRIORIDAD:

1. PRESERVACIÓN DE IDENTIDAD (MÁXIMA PRIORIDAD):
   - NO ALTERES la cara, rasgos faciales, expresión, ni identidad de la persona
   - Mantén EXACTAMENTE el mismo rostro, ojos, nariz, boca, cejas de la [Imagen 1]
   - Conserva el mismo tono de piel, textura y características faciales
   - NO modifiques el peinado, color de cabello ni accesorios faciales
   - La persona debe ser 100% reconocible como la misma de la foto original

2. PRESERVACIÓN DEL CUERPO:
   - Mantén la misma pose, postura y posición del cuerpo
   - Conserva el mismo tipo de cuerpo y proporciones
   - NO alteres la altura, complexión ni estructura corporal

3. APLICACIÓN DE PRENDAS:
   - Coloca las prendas especificadas sobre el cuerpo de la persona
   - Las prendas deben adaptarse naturalmente al cuerpo
   - Respeta la física de la tela: pliegues, caídas, arrugas naturales
   - El ajuste debe corresponder al tipo especificado (${Object.values(params).map(p => p?.fit).filter(Boolean).join(', ')})

4. INTEGRACIÓN VISUAL:
   - Mantén la misma iluminación y sombras del entorno original
   - Las sombras de las prendas deben coincidir con la luz de la [Imagen 1]
   - Conserva el mismo fondo y contexto de la foto original
   - El resultado debe parecer una foto real, no un montaje

5. COHERENCIA DEL OUTFIT:
   - Las prendas deben verse coordinadas y naturales juntas
   - Reemplaza SOLO las prendas especificadas
   - Mantén cualquier otra ropa o accesorios no especificados

RECORDATORIO FINAL: La cara y la identidad de la persona NO deben cambiar en absoluto. Es fundamental que la persona sea completamente reconocible.

Genera solo la imagen final sin texto adicional.`;
}

/**
 * Parameters for generating a virtual try-on image
 */
export interface TryOnParams {
    userImage: string;
    upperGarment?: {
        image: any;
        type: string;
        description: string;
        fit: string;
    };
    lowerGarment?: {
        image: any;
        type: string;
        description: string;
        fit: string;
    };
    footwear?: {
        image: any;
        type: string;
        description: string;
        fit: string;
    };
    onePiece?: {
        image: any;
        type: string;
        description: string;
        fit: string;
    };
    modelVersion?: 'gemini-3-pro' | 'gemini-2.5-flash'; // Add model selection
}

export interface TryOnResult {
    success: boolean;
    imageBase64?: string;
    error?: string;
}

export interface RemoveBackgroundResult {
    success: boolean;
    imageBase64?: string;
    error?: string;
}

/**
 * Generate a virtual try-on image using Gemini AI
 * Supports 1-3 garments (upper, lower, and/or footwear)
 */
export async function generateTryOnImage(params: TryOnParams): Promise<TryOnResult> {
    try {
        if (!API_KEY) {
            return {
                success: false,
                error: 'API Key no configurada. Por favor configura EXPO_PUBLIC_GOOGLE_API_KEY en el archivo .env',
            };
        }

        // Default to Gemini 3 Pro if not specified
        const modelVersion = params.modelVersion || 'gemini-3-pro';

        console.log(`🎯 Modelo seleccionado: ${modelVersion === 'gemini-3-pro' ? 'Gemini 3 Pro Image Preview' : 'Gemini 2.5 Flash Image'}`);

        if (!params.upperGarment && !params.lowerGarment && !params.footwear && !params.onePiece) {
            return {
                success: false,
                error: 'Debes seleccionar al menos una prenda',
            };
        }

        // Convert user image to base64
        const userBase64 = await imageToBase64(params.userImage);

        // Build content parts array
        const contentParts: any[] = [];

        // Build prompt parameters
        const promptParams: {
            upperGarment?: { type: string; description: string; fit: string };
            lowerGarment?: { type: string; description: string; fit: string };
            footwear?: { type: string; description: string; fit: string };
            onePiece?: { type: string; description: string; fit: string };
        } = {};

        if (params.onePiece) {
            promptParams.onePiece = {
                type: params.onePiece.type,
                description: params.onePiece.description,
                fit: params.onePiece.fit,
            };
        } else {
            if (params.upperGarment) {
                promptParams.upperGarment = {
                    type: params.upperGarment.type,
                    description: params.upperGarment.description,
                    fit: params.upperGarment.fit,
                };
            }

            if (params.lowerGarment) {
                promptParams.lowerGarment = {
                    type: params.lowerGarment.type,
                    description: params.lowerGarment.description,
                    fit: params.lowerGarment.fit,
                };
            }
        }

        if (params.footwear) {
            promptParams.footwear = {
                type: params.footwear.type,
                description: params.footwear.description,
                fit: params.footwear.fit,
            };
        }

        // Build the prompt
        const prompt = buildTryOnPrompt(promptParams);

        // IMPORTANT: For Gemini 3 Pro, text must come FIRST, then images
        // 1. Add text prompt FIRST
        contentParts.push({
            text: prompt
        });

        // 2. Then add user image
        contentParts.push({
            inline_data: {
                mime_type: 'image/jpeg',
                data: userBase64,
            },
        });

        // 3. Then add garment images
        if (params.onePiece?.image) {
            const onePieceBase64 = await imageToBase64(params.onePiece.image);
            contentParts.push({
                inline_data: {
                    mime_type: 'image/jpeg',
                    data: onePieceBase64,
                },
            });
        } else {
            if (params.upperGarment?.image) {
                const upperGarmentBase64 = await imageToBase64(params.upperGarment.image);
                contentParts.push({
                    inline_data: {
                        mime_type: 'image/jpeg',
                        data: upperGarmentBase64,
                    },
                });
            }

            if (params.lowerGarment?.image) {
                const lowerGarmentBase64 = await imageToBase64(params.lowerGarment.image);
                contentParts.push({
                    inline_data: {
                        mime_type: 'image/jpeg',
                        data: lowerGarmentBase64,
                    },
                });
            }
        }

        if (params.footwear?.image) {
            const footwearBase64 = await imageToBase64(params.footwear.image);
            contentParts.push({
                inline_data: {
                    mime_type: 'image/jpeg',
                    data: footwearBase64,
                },
            });
        }

        // Configure API based on selected model
        let apiUrl: string;
        let requestBody: any;

        if (modelVersion === 'gemini-3-pro') {
            // Gemini 3 Pro Image Preview - EXACT format from official documentation
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent`;

            console.log('🚀 Iniciando generación con Gemini 3 Pro Image Preview');
            console.log('📍 URL:', apiUrl);
            console.log('📦 Content parts:', contentParts.length, 'items (1 texto + 1 usuario + garments)');

            // Build request body matching official documentation
            requestBody = {
                contents: [{
                    parts: contentParts
                }],
                generationConfig: {
                    responseModalities: ["TEXT", "IMAGE"],
                    imageConfig: {
                        aspectRatio: "3:4",
                        imageSize: "2K"
                    }
                }
            };
        } else {
            // Gemini 2.5 Flash Image - More stable, faster
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`;

            console.log('🚀 Iniciando generación con Gemini 2.5 Flash Image');
            console.log('📍 URL:', apiUrl);
            console.log('📦 Content parts:', contentParts.length, 'items (1 texto + 1 usuario + garments)');

            // Gemini 2.5 Flash uses simpler config
            requestBody = {
                contents: [{
                    parts: contentParts
                }]
            };
        }

        console.log('📤 Enviando request...');
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
            console.error('❌ Gemini API Error Response:', errorText);
            console.error('❌ Status:', response.status, response.statusText);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        console.log(`✅ Respuesta recibida de ${modelVersion === 'gemini-3-pro' ? 'Gemini 3 Pro' : 'Gemini 2.5 Flash'}`);

        const data = await response.json();
        console.log('📊 Response data:', JSON.stringify(data, null, 2));

        // Extract the generated image from response
        const parts = data.candidates?.[0]?.content?.parts;

        if (!parts || parts.length === 0) {
            return {
                success: false,
                error: 'No se generó ninguna imagen. Intenta con otra foto o prenda.',
            };
        }

        // Find the image part (can be inlineData or inline_data)
        const imagePart = parts.find(
            (part: any) => part.inlineData || part.inline_data
        );

        if (!imagePart?.inlineData?.data && !imagePart?.inline_data?.data) {
            return {
                success: false,
                error: 'No se pudo extraer la imagen generada.',
            };
        }

        console.log('🎉 Imagen generada exitosamente con Gemini 3 Pro Image Preview');

        return {
            success: true,
            imageBase64: imagePart.inlineData?.data || imagePart.inline_data?.data,
        };
    } catch (error: any) {
        console.error('❌ Gemini API Error:', error);

        let errorMessage = 'Error al generar la imagen. Por favor intenta de nuevo.';

        if (error.message?.includes('API key')) {
            errorMessage = 'API Key inválida o no configurada correctamente.';
        } else if (error.message?.includes('quota')) {
            errorMessage = 'Límite de uso de API alcanzado. Intenta más tarde.';
        } else if (error.message?.includes('safety')) {
            errorMessage = 'La imagen fue bloqueada por filtros de seguridad. Intenta con otra foto.';
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Remove background from garment image and replace with pure white
 * Uses Gemini 2.5 Flash Image for fast, reliable processing
 */
export async function removeBackground(imageUri: string): Promise<RemoveBackgroundResult> {
    try {
        if (!API_KEY) {
            return {
                success: false,
                error: 'API Key no configurada',
            };
        }

        console.log('🎨 [removeBackground] Iniciando remoción de fondo...');
        console.log('📸 [removeBackground] ImageUri:', imageUri.substring(0, 50) + '...');

        // Read image as base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
        });

        console.log('✅ [removeBackground] Imagen convertida a base64, tamaño:', base64.length, 'caracteres');

        const prompt = `Eres un editor de imágenes profesional especializado en fotografía de producto.

TAREA: Edita esta imagen para aislar la prenda/objeto y colocar un fondo blanco puro.

INSTRUCCIONES CRÍTICAS:

1. PRESERVACIÓN DEL OBJETO:
   - Mantén la prenda/objeto EXACTAMENTE como está
   - NO modifiques colores, texturas, sombras del objeto
   - NO alteres la forma, tamaño o detalles de la prenda
   - Conserva todos los pliegues, arrugas y características naturales
   - Mantén la iluminación y sombras propias del objeto

2. REMOCIÓN DEL FONDO:
   - Elimina COMPLETAMENTE el fondo original
   - Reemplaza con blanco puro (#FFFFFF)
   - Asegúrate de que no queden restos del fondo anterior
   - Corta limpiamente los bordes del objeto
   - Si hay sombras proyectadas en el fondo, elimínalas

3. BORDES Y RECORTE:
   - Los bordes del objeto deben quedar limpios y precisos
   - Mantén detalles finos como costuras, botones, cordones
   - Si hay partes transparentes o semi-transparentes, manténlas naturales

4. CALIDAD FINAL:
   - La prenda debe verse natural sobre el fondo blanco
   - Sin halos, bordes extraños o artefactos
   - Alta definición y claridad
   - Como si fuera una foto profesional de catálogo

RESULTADO ESPERADO: Una imagen de producto profesional con fondo blanco puro, lista para e-commerce.

Genera solo la imagen editada, sin texto adicional.`;

        console.log('📤 [removeBackground] Enviando request a Gemini 2.5 Flash Image...');

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: 'image/jpeg',
                            data: base64,
                        },
                    },
                ]
            }]
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
            console.error('❌ [removeBackground] Error Response:', errorText);
            throw new Error(`API request failed: ${response.status}`);
        }

        console.log('✅ [removeBackground] Respuesta recibida de Gemini');

        const data = await response.json();

        // Extract the generated image
        const parts = data.candidates?.[0]?.content?.parts;

        if (!parts || parts.length === 0) {
            return {
                success: false,
                error: 'No se pudo procesar la imagen',
            };
        }

        const imagePart = parts.find(
            (part: any) => part.inlineData || part.inline_data
        );

        if (!imagePart?.inlineData?.data && !imagePart?.inline_data?.data) {
            return {
                success: false,
                error: 'No se pudo extraer la imagen procesada',
            };
        }

        const resultBase64 = imagePart.inlineData?.data || imagePart.inline_data?.data;

        console.log('🎉 [removeBackground] Fondo removido exitosamente');
        console.log('📊 [removeBackground] Tamaño imagen resultante:', resultBase64.length, 'caracteres');

        return {
            success: true,
            imageBase64: resultBase64,
        };
    } catch (error: any) {
        console.error('❌ [removeBackground] Error:', error);

        let errorMessage = 'Error al procesar la imagen';

        if (error.message?.includes('API key')) {
            errorMessage = 'API Key inválida';
        } else if (error.message?.includes('quota')) {
            errorMessage = 'Límite de API alcanzado';
        } else if (error.message?.includes('safety')) {
            errorMessage = 'Imagen bloqueada por filtros de seguridad';
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}
