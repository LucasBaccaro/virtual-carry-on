import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swiper from 'react-native-deck-swiper';
import { MaterialIcons } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { useOutfits } from '../../context/OutfitContext';
import CustomAlert from '../../components/CustomAlert';
import { Outfit } from '../../types';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.62;

export default function HomeScreen() {
    const { savedOutfits, removeOutfit, categories } = useOutfits();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [alertVisible, setAlertVisible] = useState(false);
    const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const swiperRef = React.useRef<Swiper<any>>(null);

    const filteredOutfits = selectedCategory === 'all'
        ? savedOutfits
        : savedOutfits.filter(outfit => outfit.categoryId === selectedCategory);

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const confirmDelete = (outfitId: string) => {
        setOutfitToDelete(outfitId);
        setAlertVisible(true);
    };

    const handleDelete = async () => {
        if (outfitToDelete) {
            try {
                const outfit = savedOutfits.find(o => o.id === outfitToDelete);
                if (outfit) {
                    await removeOutfit(outfitToDelete, outfit.imageUrl);
                }
            } catch (error) {
                console.error('Error deleting outfit:', error);
            } finally {
                setAlertVisible(false);
                setOutfitToDelete(null);
            }
        }
    };

    useEffect(() => {
        setCurrentIndex(0);
        // Reset swiper to first card when category changes
        if (swiperRef.current) {
            swiperRef.current.jumpToCardIndex(0);
        }
    }, [selectedCategory]);

    const handleImagePress = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setImageModalVisible(true);
    };

    const handleCloseImageViewer = () => {
        setImageModalVisible(false);
        // Limpiar el estado después de cerrar para evitar problemas
        setTimeout(() => {
            setSelectedImageUrl(null);
        }, 300);
    };

    const images = selectedImageUrl ? [{ uri: selectedImageUrl }] : [];

    const renderCard = (outfit: typeof savedOutfits[0], index: number) => {
        if (!outfit) return null;

        return (
            <View key={`card-${outfit.id}-${index}`} style={styles.card}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleImagePress(outfit.imageUrl)}
                    style={styles.imageContainer}
                >
                    <Image
                        source={{ uri: outfit.imageUrl }}
                        style={styles.cardImage}
                        resizeMode="cover"
                    />
                </TouchableOpacity>

                {/* Counter Badge */}
                <View style={styles.counterBadge}>
                    <Text style={styles.counterText}>
                        {index + 1}/{filteredOutfits.length}
                    </Text>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(outfit.id)}
                >
                    <MaterialIcons name="delete-outline" size={24} color="black" />
                </TouchableOpacity>

                {/* Date Badge */}
                <View style={styles.dateBadge}>
                    <MaterialIcons name="calendar-today" size={14} color="white" />
                    <Text style={styles.dateText}>{formatDate(outfit.timestamp)}</Text>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="checkroom" size={80} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No saved outfits</Text>
            <Text style={styles.emptySubtext}>
                {selectedCategory === 'all'
                    ? 'Create your first outfit in the Fitting Room'
                    : 'No outfits found in this category'}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mis Outfits</Text>
            </View>

            {/* Category Filter */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContent}
                >
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            selectedCategory === 'all' && styles.activeFilterChip
                        ]}
                        onPress={() => setSelectedCategory('all')}
                    >
                        <Text style={[
                            styles.filterText,
                            selectedCategory === 'all' && styles.activeFilterText
                        ]}>All Outfits</Text>
                    </TouchableOpacity>

                    {categories.map((category, index) => (
                        <TouchableOpacity
                            key={`category-${category.id}-${index}`}
                            style={[
                                styles.filterChip,
                                selectedCategory === category.id && styles.activeFilterChip
                            ]}
                            onPress={() => setSelectedCategory(category.id)}
                        >
                            <Text style={[
                                styles.filterText,
                                selectedCategory === category.id && styles.activeFilterText
                            ]}>{category.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Cards or Empty State */}
            {filteredOutfits.length === 0 ? (
                renderEmptyState()
            ) : (
                <View style={styles.swiperContainer}>
                    <Swiper
                        key={`swiper-${selectedCategory}-${filteredOutfits.length}-${filteredOutfits.map(o => o.id).join('-')}`}
                        ref={swiperRef}
                        cards={filteredOutfits}
                        renderCard={renderCard}
                        onSwiped={(cardIndex) => {
                            // Only update state, don't do complex calculations
                            setCurrentIndex(cardIndex);
                        }}
                        cardIndex={0}
                        backgroundColor="transparent"
                        stackSize={3}
                        stackScale={5}
                        stackSeparation={15}
                        disableTopSwipe
                        disableBottomSwipe
                        disableLeftSwipe={filteredOutfits.length === 1}
                        disableRightSwipe={filteredOutfits.length === 1}
                        infinite={filteredOutfits.length > 1}
                        showSecondCard={filteredOutfits.length > 1}
                        verticalSwipe={false}
                        animateCardOpacity
                    />
                </View>
            )}

            {/* Image Zoom Viewer */}
            {selectedImageUrl && (
                <ImageViewing
                    key={`image-viewer-${selectedImageUrl}`}
                    images={images}
                    imageIndex={0}
                    visible={imageModalVisible}
                    onRequestClose={handleCloseImageViewer}
                    backgroundColor="rgba(0, 0, 0, 0.95)"
                />
            )}

            {/* Custom Alert for Delete */}
            <CustomAlert
                visible={alertVisible}
                title="Delete Outfit?"
                message="Are you sure you want to delete this outfit? This action cannot be undone."
                onClose={() => setAlertVisible(false)}
                buttons={[
                    { text: 'Cancel', style: 'cancel', onPress: () => setAlertVisible(false) },
                    { text: 'Delete', style: 'destructive', onPress: handleDelete }
                ]}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // bg-white
    },
    header: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    filterContainer: {
        height: 50,
        marginBottom: 4,
        marginTop: 12,
    },
    filterContent: {
        paddingHorizontal: spacing.lg,
        gap: 8,
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 9999, // rounded-full
        backgroundColor: '#F3F4F6', // bg-gray-100
    },
    activeFilterChip: {
        backgroundColor: '#000000',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4B5563', // text-gray-600
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    swiperContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -40,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: borderRadius.lg,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#F3F4F6', // border-gray-100
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15, // shadow-subtle
        elevation: 5,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
    },
    deleteButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // bg-white/60
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    dateBadge: {
        position: 'absolute',
        bottom: spacing.md,
        left: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    emptySubtext: {
        fontSize: 16,
        color: colors.textTertiary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    counterBadge: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        zIndex: 10,
    },
    counterText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
    },
});
