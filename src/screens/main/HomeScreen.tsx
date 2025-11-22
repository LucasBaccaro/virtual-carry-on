import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { useOutfits } from '../../context/OutfitContext';
import CustomAlert from '../../components/CustomAlert';
import PageHeader from '../../components/PageHeader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.5;

interface CategorySection {
    categoryId: string;
    categoryName: string;
    outfits: any[];
}

export default function HomeScreen() {
    const { savedOutfits, removeOutfit, categories } = useOutfits();
    const [alertVisible, setAlertVisible] = useState(false);
    const [outfitToDelete, setOutfitToDelete] = useState<{ id: string; imageUrl: string } | null>(null);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    // Agrupar outfits por categoría
    const categorySections: CategorySection[] = React.useMemo(() => {
        // Primero, crear sección "Sin categoría" para outfits sin categoryId
        const uncategorizedOutfits = savedOutfits.filter(outfit => !outfit.categoryId);
        const sections: CategorySection[] = [];

        if (uncategorizedOutfits.length > 0) {
            sections.push({
                categoryId: 'uncategorized',
                categoryName: 'Sin Categoría',
                outfits: uncategorizedOutfits,
            });
        }

        // Luego, crear una sección por cada categoría que tenga outfits
        categories.forEach(category => {
            const categoryOutfits = savedOutfits.filter(outfit => outfit.categoryId === category.id);
            if (categoryOutfits.length > 0) {
                sections.push({
                    categoryId: category.id,
                    categoryName: category.name,
                    outfits: categoryOutfits,
                });
            }
        });

        return sections;
    }, [savedOutfits, categories]);

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const confirmDelete = (outfitId: string, imageUrl: string) => {
        setOutfitToDelete({ id: outfitId, imageUrl });
        setAlertVisible(true);
    };

    const handleDelete = async () => {
        if (outfitToDelete) {
            try {
                await removeOutfit(outfitToDelete.id, outfitToDelete.imageUrl);
            } catch (error) {
                console.error('Error deleting outfit:', error);
            } finally {
                setAlertVisible(false);
                setOutfitToDelete(null);
            }
        }
    };

    const handleImagePress = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setImageModalVisible(true);
    };

    const handleCloseImageViewer = () => {
        setImageModalVisible(false);
        setTimeout(() => {
            setSelectedImageUrl(null);
        }, 300);
    };

    const images = selectedImageUrl ? [{ uri: selectedImageUrl }] : [];

    const renderCard = (outfit: any, index: number, totalInCategory: number) => {
        if (!outfit) return null;

        return (
            <View style={styles.card}>
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
                        {index + 1}/{totalInCategory}
                    </Text>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(outfit.id, outfit.imageUrl)}
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

    const renderCategorySection = (section: CategorySection) => {
        return (
            <View key={section.categoryId} style={styles.categorySection}>
                {/* Category Header */}
                <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{section.categoryName}</Text>
                    <Text style={styles.categoryCount}>{section.outfits.length} outfit{section.outfits.length !== 1 ? 's' : ''}</Text>
                </View>

                {/* Swiper Container */}
                <View style={styles.swiperWrapper}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        decelerationRate="fast"
                        snapToInterval={CARD_WIDTH + 20}
                        snapToAlignment="center"
                        contentContainerStyle={styles.horizontalScrollContent}
                    >
                        {section.outfits.map((outfit, index) => (
                            <View key={outfit.id} style={styles.cardWrapper}>
                                {renderCard(outfit, index, section.outfits.length)}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialIcons name="checkroom" size={80} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No saved outfits</Text>
            <Text style={styles.emptySubtext}>
                Create your first outfit in the Fitting Room
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <PageHeader title="Mis Outfits" />

            {/* Content */}
            {savedOutfits.length === 0 ? (
                renderEmptyState()
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {categorySections.map(section => renderCategorySection(section))}
                </ScrollView>
            )}

            {/* Image Zoom Viewer */}
            {selectedImageUrl && (
                <ImageViewing
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
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: spacing.sm, // Reduced from spacing.md
    },
    categorySection: {
        marginBottom: spacing.lg,
    },
    categoryHeader: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    categoryCount: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    swiperWrapper: {
        height: CARD_HEIGHT + 20,
    },
    horizontalScrollContent: {
        paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
        gap: 12,
    },
    cardWrapper: {
        width: CARD_WIDTH,
    },
    singleCardContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: borderRadius.lg,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
    },
    deleteButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
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
});
