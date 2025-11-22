import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { useOutfits } from '../../context/OutfitContext';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/CustomAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.55;

interface CategorySection {
    categoryId: string;
    categoryName: string;
    outfits: any[];
}

export default function HomeScreen() {
    const navigation = useNavigation();
    const { savedOutfits, removeOutfit, categories } = useOutfits();
    const { user } = useAuth();
    const [alertVisible, setAlertVisible] = useState(false);
    const [outfitToDelete, setOutfitToDelete] = useState<{ id: string; imageUrl: string } | null>(null);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    // Get greeting
    const currentDate = new Date();
    const hour = currentDate.getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    const userName = user?.email?.split('@')[0] || 'Usuario';

    // Agrupar outfits por categoría
    const categorySections: CategorySection[] = React.useMemo(() => {
        const uncategorizedOutfits = savedOutfits.filter(outfit => !outfit.categoryId);
        const sections: CategorySection[] = [];

        if (uncategorizedOutfits.length > 0) {
            sections.push({
                categoryId: 'uncategorized',
                categoryName: 'Recientes',
                outfits: uncategorizedOutfits,
            });
        }

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

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.greeting}>{greeting},</Text>
                <Text style={styles.userName}>{userName}</Text>
            </View>
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{savedOutfits.length}</Text>
                    <Text style={styles.statLabel}>Outfits</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{categories.length}</Text>
                    <Text style={styles.statLabel}>Categorías</Text>
                </View>
            </View>
        </View>
    );

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
                    <MaterialIcons name="delete-outline" size={22} color="#000" />
                </TouchableOpacity>

                {/* Date Badge */}
                <View style={styles.dateBadge}>
                    <MaterialIcons name="calendar-today" size={12} color="white" />
                    <Text style={styles.dateText}>{formatDate(outfit.timestamp)}</Text>
                </View>
            </View>
        );
    };

    const renderCategorySection = (section: CategorySection) => {
        return (
            <View key={section.categoryId} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{section.categoryName}</Text>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{section.outfits.length}</Text>
                    </View>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    snapToInterval={CARD_WIDTH + 16}
                    snapToAlignment="start"
                    contentContainerStyle={styles.cardsScrollContent}
                >
                    {section.outfits.map((outfit, index) => (
                        <View key={outfit.id} style={styles.cardWrapper}>
                            {renderCard(outfit, index, section.outfits.length)}
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderEmptyState = () => (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.emptyScrollContent}
            showsVerticalScrollIndicator={false}
        >
            {renderHeader()}

            <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                    <MaterialIcons name="style" size={48} color="#000" />
                </View>
                <Text style={styles.emptyTitle}>Tu colección está vacía</Text>
                <Text style={styles.emptyMessage}>
                    Empieza a crear outfits virtuales y guárdalos aquí para tener todas tus combinaciones en un solo lugar
                </Text>
                <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => navigation.navigate('Wardrobe' as never)}
                >
                    <Text style={styles.emptyButtonText}>Crear primer outfit</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {savedOutfits.length === 0 ? (
                renderEmptyState()
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {renderHeader()}

                    <View style={styles.outfitsSection}>
                        {categorySections.map(section => renderCategorySection(section))}
                    </View>
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
                title="¿Eliminar outfit?"
                message="Esta acción no se puede deshacer. El outfit será eliminado permanentemente."
                onClose={() => setAlertVisible(false)}
                buttons={[
                    { text: 'Cancelar', style: 'cancel', onPress: () => setAlertVisible(false) },
                    { text: 'Eliminar', style: 'destructive', onPress: handleDelete }
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
        paddingBottom: 100,
    },
    emptyScrollContent: {
        paddingBottom: 100,
    },
    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
        backgroundColor: '#FFFFFF',
    },
    greeting: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
        marginBottom: 4,
    },
    userName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#000',
        marginBottom: 20,
        textTransform: 'capitalize',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: '#000',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E0E0E0',
    },
    // Actions
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    primaryAction: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
    },
    primaryActionText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
    secondaryAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8F9FA',
        paddingVertical: 16,
        borderRadius: 14,
        gap: 6,
    },
    secondaryActionText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000',
    },
    // Outfits Section
    outfitsSection: {
        marginTop: 8,
    },
    categorySection: {
        marginBottom: 32,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 10,
    },
    categoryTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#000',
    },
    categoryBadge: {
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#666',
    },
    cardsScrollContent: {
        paddingLeft: 20,
        paddingRight: 20,
        gap: 16,
    },
    cardWrapper: {
        width: CARD_WIDTH,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        backgroundColor: '#FAFAFA',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    counterBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    counterText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
    deleteButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    dateBadge: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFF',
    },
    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingTop: 60,
        paddingBottom: 40,
    },
    emptyIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#000',
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#000',
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 30,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});
