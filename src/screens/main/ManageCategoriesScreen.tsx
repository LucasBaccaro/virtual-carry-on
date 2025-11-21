import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOutfits } from '../../context/OutfitContext';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import CustomAlert from '../../components/CustomAlert';

export default function ManageCategoriesScreen() {
    const navigation = useNavigation();
    const { categories, addCategory, removeCategory, updateCategory } = useOutfits();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<{ id: string, name: string } | null>(null);
    const [categoryName, setCategoryName] = useState('');

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
    }>({ title: '', message: '' });

    const showAlert = (title: string, message: string, buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[]) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };

    const handleAddPress = () => {
        setEditingCategory(null);
        setCategoryName('');
        setModalVisible(true);
    };

    const handleEditPress = (category: { id: string, name: string }) => {
        setEditingCategory(category);
        setCategoryName(category.name);
        setModalVisible(true);
    };

    const handleDeletePress = (id: string) => {
        showAlert(
            'Delete Category',
            'Are you sure you want to delete this category?',
            [
                { text: 'Cancel', style: 'cancel', onPress: () => setAlertVisible(false) },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await removeCategory(id);
                        setAlertVisible(false);
                    },
                },
            ]
        );
    };

    const handleSave = async () => {
        if (!categoryName.trim()) return;

        if (editingCategory) {
            await updateCategory(editingCategory.id, categoryName.trim());
        } else {
            await addCategory(categoryName.trim());
        }
        setModalVisible(false);
        setCategoryName('');
        setEditingCategory(null);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Categories</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.doneButton}>
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView style={styles.content}>
                {categories.map((category) => (
                    <View key={category.id} style={styles.listItem}>
                        <View style={styles.itemLeft}>
                            <View style={styles.dragHandle}>
                                <MaterialIcons name="drag-indicator" size={24} color="#A1A1AA" />
                            </View>
                            <Text style={styles.itemText} numberOfLines={1}>{category.name}</Text>
                        </View>
                        <View style={styles.itemActions}>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => handleEditPress(category)}
                            >
                                <MaterialIcons name="edit" size={20} color="#1A1A1A" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => handleDeletePress(category.id)}
                            >
                                <MaterialIcons name="delete" size={20} color="#1A1A1A" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
                    <Text style={styles.addButtonText}>Add New Category</Text>
                </TouchableOpacity>
            </View>

            {/* Add/Edit Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingCategory ? 'Edit Category' : 'New Category'}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Category Name"
                            value={categoryName}
                            onChangeText={setCategoryName}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
        flex: 1,
    },
    doneButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
        paddingVertical: 8,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    dragHandle: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 16,
        color: '#1A1A1A',
        flex: 1,
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#FFFFFF', // hover:bg-zinc-100 logic handled by TouchableOpacity opacity
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
        backgroundColor: '#FFFFFF',
    },
    addButton: {
        height: 48,
        backgroundColor: '#1A1A1A',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
        color: '#1A1A1A',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 24,
        color: '#1A1A1A',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    saveButton: {
        backgroundColor: '#1A1A1A',
    },
    cancelButtonText: {
        color: '#1A1A1A',
        fontWeight: '600',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
