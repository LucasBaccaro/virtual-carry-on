import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
    Image,
    Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
    startFashionAgentConversation,
    sendMessageToAgent,
    ChatMessage,
} from '../../services/fashionAgent';
import { getGarments } from '../../services/supabaseService';
import PageHeader from '../../components/PageHeader';

export default function FashionAgentScreen() {
    const { user } = useAuth();
    const navigation = useNavigation();
    const scrollViewRef = useRef<ScrollView>(null);
    const insets = useSafeAreaInsets();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const keyboardWillShowListener = Keyboard.addListener(keyboardShowEvent, () => {
            setKeyboardVisible(true);
        });
        const keyboardWillHideListener = Keyboard.addListener(keyboardHideEvent, () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, []);

    useEffect(() => {
        initializeConversation();
    }, []);

    const initializeConversation = async () => {
        if (!user) return;

        try {
            setInitializing(true);

            // Load user's garments
            const result = await getGarments(user.id);
            const garments = result.data || [];

            // Start conversation
            const initialMessage = await startFashionAgentConversation(garments);
            setMessages([initialMessage]);
        } catch (error) {
            console.error('Error initializing conversation:', error);
        } finally {
            setInitializing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !user) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setLoading(true);

        try {
            // Load user's garments
            const result = await getGarments(user.id);
            const garments = result.data || [];

            // Send message to agent
            const agentResponse = await sendMessageToAgent(
                userMessage.content,
                [...messages, userMessage],
                garments
            );

            setMessages(prev => [...prev, agentResponse]);

            // Scroll to bottom
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Error sending message:', error);

            const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'agent',
                content: 'Lo siento, hubo un error. ¿Podés intentar de nuevo?',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptLook = (recommendation: any) => {
        // Navigate to Wardrobe screen with pre-selected garments
        // We need to navigate to MainTabs first since Wardrobe is inside it
        navigation.navigate('MainTabs', {
            screen: 'Wardrobe',
            params: {
                preselectedGarments: recommendation.garments,
                autoGenerate: true,
            }
        } as any);
    };

    if (initializing) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <PageHeader title="Asistente Personal" showBackButton />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loadingText}>Iniciando conversación...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <PageHeader title="Asistente Personal" showBackButton />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            onAcceptLook={handleAcceptLook}
                        />
                    ))}

                    {loading && (
                        <View style={styles.typingIndicator}>
                            <ActivityIndicator size="small" color="#666" />
                            <Text style={styles.typingText}>Pensando...</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={[styles.inputContainer, { paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 12) }]}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Escribe tu respuesta..."
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                        editable={!loading}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={!inputText.trim() || loading}
                    >
                        <MaterialIcons name="send" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

interface MessageBubbleProps {
    message: ChatMessage;
    onAcceptLook: (recommendation: any) => void;
}

function MessageBubble({ message, onAcceptLook }: MessageBubbleProps) {
    const isAgent = message.role === 'agent';

    return (
        <View style={[styles.messageBubble, isAgent ? styles.agentBubble : styles.userBubble]}>
            {isAgent && (
                <View style={styles.agentAvatar}>
                    <MaterialIcons name="smart-toy" size={20} color="#FFF" />
                </View>
            )}

            <View style={[styles.bubbleContent, isAgent ? styles.agentContent : styles.userContent]}>
                <Text style={[styles.messageText, isAgent ? styles.agentText : styles.userText]}>
                    {message.content}
                </Text>

                {/* Show recommendations if present */}
                {message.recommendations && message.recommendations.length > 0 && (
                    <View style={styles.recommendationsContainer}>
                        {message.recommendations.map((rec, index) => (
                            <RecommendationCard
                                key={rec.id}
                                recommendation={rec}
                                index={index + 1}
                                onAccept={() => onAcceptLook(rec)}
                            />
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

interface RecommendationCardProps {
    recommendation: any;
    index: number;
    onAccept: () => void;
}

function RecommendationCard({ recommendation, index, onAccept }: RecommendationCardProps) {
    const [garmentImages, setGarmentImages] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGarmentImages();
    }, []);

    const loadGarmentImages = async () => {
        try {
            const { getGarmentById } = require('../../services/fashionRecommendations');

            const [upper, lower, footwear] = await Promise.all([
                getGarmentById(recommendation.garments.upperId),
                getGarmentById(recommendation.garments.lowerId),
                getGarmentById(recommendation.garments.footwearId),
            ]);

            setGarmentImages({ upper, lower, footwear });
        } catch (error) {
            console.error('Error loading garment images:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.recCard}>
                <ActivityIndicator size="small" color="#000" />
            </View>
        );
    }

    // Check if all garments loaded successfully
    const hasAllGarments = garmentImages.upper && garmentImages.lower && garmentImages.footwear;

    return (
        <View style={styles.recCard}>
            <View style={styles.recHeader}>
                <Text style={styles.recNumber}>Look #{index}</Text>
                <View style={styles.recScore}>
                    <MaterialIcons name="star" size={14} color="#FFD700" />
                    <Text style={styles.recScoreText}>{recommendation.score}/10</Text>
                </View>
            </View>

            <Text style={styles.recName}>{recommendation.name}</Text>
            <Text style={styles.recDescription}>{recommendation.description}</Text>

            {/* Garment Images */}
            <View style={styles.recImages}>
                {garmentImages.upper && (
                    <Image source={{ uri: garmentImages.upper.image_url }} style={styles.recImage} />
                )}
                {garmentImages.lower && (
                    <Image source={{ uri: garmentImages.lower.image_url }} style={styles.recImage} />
                )}
                {garmentImages.footwear && (
                    <Image source={{ uri: garmentImages.footwear.image_url }} style={styles.recImage} />
                )}
            </View>

            <TouchableOpacity
                style={[styles.recButton, !hasAllGarments && styles.recButtonDisabled]}
                onPress={onAccept}
                disabled={!hasAllGarments}
            >
                <Text style={styles.recButtonText}>
                    {hasAllGarments ? 'Probar este Look' : 'Cargando...'}
                </Text>
                {hasAllGarments && <MaterialIcons name="arrow-forward" size={16} color="#FFF" />}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    keyboardView: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    messageBubble: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '90%', // Increased from 85%
    },
    agentBubble: {
        alignSelf: 'flex-start',
    },
    userBubble: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    agentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    bubbleContent: {
        borderRadius: 16,
        padding: 14, // Increased from 12
    },
    agentContent: {
        backgroundColor: '#F3F4F6',
    },
    userContent: {
        backgroundColor: '#000',
    },
    messageText: {
        fontSize: 16, // Increased from 15
        lineHeight: 22, // Increased from 20
    },
    agentText: {
        color: '#1A1A1A',
    },
    userText: {
        color: '#FFFFFF',
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 40,
        marginBottom: 16,
    },
    typingText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        paddingBottom: 12, // Padding handled dynamically via style prop
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: '#1A1A1A',
        marginRight: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#CCC',
    },
    recommendationsContainer: {
        marginTop: 12,
        gap: 12,
    },
    recCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    recHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    recNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    recScore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    recScoreText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    recName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    recDescription: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
    },
    recImages: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    recImage: {
        flex: 1,
        aspectRatio: 3 / 4,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
    },
    recButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#000',
        paddingVertical: 10,
        borderRadius: 8,
    },
    recButtonDisabled: {
        backgroundColor: '#CCC',
    },
    recButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
