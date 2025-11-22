Análisis de Uso y Costos de Modelos Gemini en SmartFit
Este documento detalla el uso de los modelos de Google Gemini en el directorio SmartFit/src/services, analizando qué modelo se utiliza en cada función, su propósito y una estimación de costos basada en los precios provistos.

Resumen de Modelos Utilizados
Servicio	Función	Modelo	Propósito	Tipo de Uso
garmentAnalysis.ts	analyzeGarmentWithAI	Gemini 2.5 Flash	Analizar imagen de prenda y extraer metadatos (color, estilo, etc.)	Multimodal (Texto + Imagen)
fashionAgent.ts	sendMessageToAgent	Gemini 2.0 Flash Exp	Chatbot asistente de moda y llamadas a funciones	Texto (Chat + Function Calling)
fashionRecommendations.ts	callGeminiForRecommendations	Gemini 2.5 Flash	Generar combinaciones de outfits basadas en el guardarropa	Texto (JSON in/out)
gemini.ts	generateTryOnImage	Gemini 3 Pro Image Preview (Default)	Generar imagen de prueba virtual (Virtual Try-On)	Generación de Imagen
gemini.ts	removeBackground	Gemini 2.5 Flash Image	Eliminar fondo de fotos de prendas	Edición de Imagen
Análisis Detallado por Servicio
1. Análisis de Prendas (garmentAnalysis.ts)
Función: analyzeGarmentWithAI
Modelo: gemini-2.5-flash
Descripción: Toma una foto de una prenda y un prompt de texto para extraer características como color, ocasión, estilo y versatilidad en formato JSON.
Costo Estimado (Nivel Pago):
Entrada: Imagen (~258 tokens) + Prompt (~100 tokens) ≈ 358 tokens.
Salida: JSON (~200 tokens).
Costo: Extremadamente bajo.
Input: ~$0.00003 USD
Output: ~$0.00008 USD
Total por análisis: < $0.0001 USD (Menos de 1 centavo por 100 análisis).
2. Agente de Moda (fashionAgent.ts)
Función: sendMessageToAgent
Modelo: gemini-2.0-flash-exp
Descripción: Maneja la conversación con el usuario. Mantiene el contexto del chat y decide cuándo llamar a la herramienta de recomendaciones.
Costo Estimado (Nivel Pago - Asumiendo precio Flash):
Entrada: Historial de chat + Prompt de sistema (~500-1000 tokens).
Salida: Respuesta de texto (~100-300 tokens).
Costo: Muy bajo.
Input: ~$0.0001 USD
Output: ~$0.0001 USD
Total por mensaje: ~ $0.0002 USD.
3. Recomendaciones de Outfits (fashionRecommendations.ts)
Función: callGeminiForRecommendations
Modelo: gemini-2.5-flash
Descripción: Recibe una lista de prendas del usuario (texto) y genera combinaciones (outfits) en formato JSON.
Costo Estimado (Nivel Pago):
Entrada: Lista de prendas (varía según guardarropa, ~1000-3000 tokens para 50 prendas).
Salida: JSON de recomendaciones (~500 tokens).
Costo: Bajo.
Input: ~$0.0003 USD
Output: ~$0.0002 USD
Total por recomendación: ~ $0.0005 USD.
4. Virtual Try-On (gemini.ts)
Función: generateTryOnImage
Modelo: gemini-3-pro-image-preview (Configurable, por defecto Pro)
Descripción: Genera una imagen fotorrealista del usuario vistiendo las prendas seleccionadas. Es la operación más compleja y costosa.
Costo Estimado (Nivel Pago):
Entrada: Imagen Usuario + Imágenes Prendas (2-4 imágenes) + Prompt.
Costo Input: ~$0.0011 USD por imagen de entrada.
Salida: 1 Imagen Generada (Standard).
Costo Output: ~$0.134 USD por imagen generada.
Total por Try-On: ~ $0.14 USD (aprox. 14 centavos por generación).
Nota: Si se usa gemini-2.5-flash-image, el costo baja drásticamente a ~$0.04 USD por imagen.
5. Remoción de Fondo (gemini.ts)
Función: removeBackground
Modelo: gemini-2.5-flash-image
Descripción: Edita la foto de una prenda para dejar el fondo blanco.
Costo Estimado (Nivel Pago):
Entrada: 1 Imagen + Prompt.
Salida: 1 Imagen Generada (Editada).
Total por Edición: ~ $0.04 USD (aprox. 4 centavos por imagen).
Resumen de Rentabilidad
Operación	Costo Aprox. (USD)	Frecuencia Típica	Costo Mensual Est. (100 usuarios activos)
Chat con Agente	$0.0002 / msg	Alta (10 msg/día)	$6.00
Análisis de Prenda	$0.0001 / prenda	Media (5 prendas/mes)	$0.05
Recomendaciones	$0.0005 / gen	Media (1 vez/día)	$1.50
Remover Fondo	$0.04 / prenda	Media (5 prendas/mes)	$20.00
Virtual Try-On (Pro)	$0.14 / imagen	Baja/Media (2 veces/sem)	$112.00
Conclusiones
Texto y Análisis (Flash): Son extremadamente baratos. No representan un riesgo de costos significativo.
Generación de Imágenes (Try-On): Es el costo principal. Usar Gemini 3 Pro ofrece la mejor calidad pero a un costo de ~$0.14 por imagen.
Recomendación: Evaluar si gemini-2.5-flash-image ofrece calidad suficiente para pruebas rápidas (baja el costo a ~$0.04).
Remoción de Fondo: Tiene un costo moderado ($0.04). Se ejecuta solo una vez cuando el usuario sube una prenda.
Recomendación de Optimización
Para optimizar costos en el Virtual Try-On, se podría implementar una lógica híbrida:

Usar Gemini 2.5 Flash Image ($0.04) para "pruebas rápidas" o usuarios gratuitos.
Reservar Gemini 3 Pro ($0.14) para "generación final en alta calidad" o usuarios Premium.
