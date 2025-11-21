import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';

interface ImagePreviewProps {
    originalImage: any;
    generatedImageBase64?: string;
}

export default function ImagePreview({ originalImage, generatedImageBase64 }: ImagePreviewProps) {
    const [showOriginal, setShowOriginal] = useState(false);

    const displayImage = generatedImageBase64 && !showOriginal
        ? { uri: `data:image/png;base64,${generatedImageBase64}` }
        : originalImage;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => generatedImageBase64 && setShowOriginal(true)}
                onPressOut={() => setShowOriginal(false)}
                style={styles.imageContainer}
            >
                <Image
                    source={displayImage}
                    style={styles.image}
                    resizeMode="cover"
                />
                {generatedImageBase64 && (
                    <View style={styles.hint}>
                        <Text style={styles.hintText}>
                            {showOriginal ? '👆 Original' : '👆 Mantén presionado para comparar'}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 3 / 4, // Portrait aspect ratio for better display
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        backgroundColor: colors.backgroundSecondary,
        ...shadows.md,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    hint: {
        position: 'absolute',
        bottom: spacing.md,
        alignSelf: 'center',
        backgroundColor: colors.overlay,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    hintText: {
        color: colors.textInverse,
        fontSize: 12,
        fontWeight: '500',
    },
});
