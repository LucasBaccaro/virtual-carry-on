import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ModelSelectorProps {
    selectedModel: 'gemini-3-pro' | 'gemini-2.5-flash';
    onSelectModel: (model: 'gemini-3-pro' | 'gemini-2.5-flash') => void;
}

export default function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Modelo de IA:</Text>
            <View style={styles.optionsContainer}>
                <TouchableOpacity
                    style={[
                        styles.option,
                        selectedModel === 'gemini-3-pro' && styles.selectedOption
                    ]}
                    onPress={() => onSelectModel('gemini-3-pro')}
                >
                    <MaterialIcons
                        name="auto-awesome"
                        size={16}
                        color={selectedModel === 'gemini-3-pro' ? '#FFFFFF' : '#666666'}
                    />
                    <Text style={[
                        styles.optionText,
                        selectedModel === 'gemini-3-pro' && styles.selectedOptionText
                    ]}>Gemini 3 Pro</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.option,
                        selectedModel === 'gemini-2.5-flash' && styles.selectedOption
                    ]}
                    onPress={() => onSelectModel('gemini-2.5-flash')}
                >
                    <MaterialIcons
                        name="flash-on"
                        size={16}
                        color={selectedModel === 'gemini-2.5-flash' ? '#FFFFFF' : '#666666'}
                    />
                    <Text style={[
                        styles.optionText,
                        selectedModel === 'gemini-2.5-flash' && styles.selectedOptionText
                    ]}>Gemini 2.5 Flash</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    optionsContainer: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 4,
    },
    option: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    selectedOption: {
        backgroundColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    optionText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#666666',
    },
    selectedOptionText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
