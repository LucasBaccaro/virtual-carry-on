import React from 'react';
import { View, Image, TouchableOpacity, Text, FlatList, StyleSheet } from 'react-native';
import { Garment } from '../types';

interface GarmentCarouselProps {
    garments: Garment[];
    selectedGarment: Garment | null;
    onSelect: (garment: Garment) => void;
}

const CARD_SIZE = 120;

export default function GarmentCarousel({ garments, selectedGarment, onSelect }: GarmentCarouselProps) {
    const renderItem = ({ item }: { item: Garment }) => {
        const isSelected = selectedGarment?.id === item.id;

        return (
            <TouchableOpacity
                onPress={() => onSelect(item)}
                style={[
                    styles.garmentCard,
                    isSelected && styles.selectedCard,
                ]}
                activeOpacity={0.7}
            >
                <Image
                    source={item.image}
                    style={styles.garmentImage}
                    resizeMode="cover"
                />
                {isSelected && (
                    <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            data={garments}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
        />
    );
}

const styles = StyleSheet.create({
    listContainer: {
        paddingVertical: 8,
    },
    garmentCard: {
        width: CARD_SIZE,
        height: CARD_SIZE,
        marginRight: 12,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    selectedCard: {
        borderColor: '#3b82f6',
        borderWidth: 4,
    },
    garmentImage: {
        width: '100%',
        height: '100%',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmarkText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
