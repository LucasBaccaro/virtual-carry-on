import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants/theme';

interface AlertButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    buttons?: AlertButton[];
    onClose?: () => void;
}

export default function CustomAlert({ visible, title, message, buttons = [], onClose }: CustomAlertProps) {
    // If no buttons are provided, show a default "OK" button
    const actionButtons = buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default', onPress: onClose }];

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.buttonContainer}>
                        {actionButtons.map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    button.style === 'cancel' ? styles.buttonCancel :
                                        button.style === 'destructive' ? styles.buttonDestructive : styles.buttonDefault,
                                    // Add margin if there are multiple buttons
                                    index > 0 && { marginLeft: 12 }
                                ]}
                                onPress={() => {
                                    if (button.onPress) button.onPress();
                                    if (onClose) onClose();
                                }}
                            >
                                <Text style={[
                                    styles.buttonText,
                                    button.style === 'cancel' ? styles.textCancel :
                                        button.style === 'destructive' ? styles.textDestructive : styles.textDefault
                                ]}>
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '85%',
        maxWidth: 380,
        backgroundColor: '#F8F6F8',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDefault: {
        backgroundColor: '#000000',
    },
    buttonDestructive: {
        backgroundColor: '#000000', // Design uses black for delete too, but maybe we want red? 
        // The user prompt showed black for delete. Sticking to black.
    },
    buttonCancel: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    textDefault: {
        color: '#FFFFFF',
    },
    textDestructive: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    textCancel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
    },
});
