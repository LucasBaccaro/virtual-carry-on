import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Image,
    Dimensions,
    ScrollView,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';

type AuthStackParamList = {
    Onboarding: undefined;
    Login: undefined;
    Signup: undefined;
};

type OnboardingScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const onboardingData = [
    {
        id: 1,
        image: require('../../../assets/images/onboarding-1.jpg'),
        title: 'Tu Guardarropa Virtual',
        description: 'Digitaliza todas tus prendas y accede a tu closet desde cualquier lugar',
    },
    {
        id: 2,
        image: require('../../../assets/images/onboarding-2.jpg'),
        title: 'Prueba con IA',
        description: 'Visualiza cómo te quedan diferentes outfits antes de vestirte',
    },
    {
        id: 3,
        image: require('../../../assets/images/onboarding-3.jpg'),
        title: 'Organiza y Guarda',
        description: 'Crea categorías personalizadas y guarda tus combinaciones favoritas',
    },
];

export default function OnboardingScreen() {
    const navigation = useNavigation<OnboardingScreenNavigationProp>();
    const { setFirstLaunchComplete } = useAuth();
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / SCREEN_WIDTH);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (currentIndex < onboardingData.length - 1) {
            scrollViewRef.current?.scrollTo({
                x: SCREEN_WIDTH * (currentIndex + 1),
                animated: true,
            });
        }
    };

    const handleSkip = async () => {
        await setFirstLaunchComplete();
        navigation.replace('Login');
    };

    const handleGetStarted = async () => {
        await setFirstLaunchComplete();
        navigation.replace('Signup');
    };

    const isLastSlide = currentIndex === onboardingData.length - 1;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Skip Button */}
            {!isLastSlide && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Saltar</Text>
                </TouchableOpacity>
            )}

            {/* Pager Content */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {onboardingData.map((item) => (
                    <View key={item.id} style={styles.slide}>
                        {/* Image Container */}
                        <View style={styles.imageContainer}>
                            <Image
                                source={item.image}
                                style={styles.image}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Text Content */}
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Bottom Section - Fixed Height */}
            <View style={styles.bottomSection}>
                {/* Pagination Dots */}
                <View style={styles.paginationContainer}>
                    {onboardingData.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>

                {/* Action Buttons - Fixed Container */}
                <View style={styles.buttonWrapper}>
                    {isLastSlide ? (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleGetStarted}
                            >
                                <Text style={styles.primaryButtonText}>Comenzar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleSkip}
                            >
                                <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.singleButtonContainer}>
                            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                                <Text style={styles.primaryButtonText}>Siguiente</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    skipButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '400',
        color: '#000000',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    imageContainer: {
        width: SCREEN_WIDTH * 0.85,
        height: SCREEN_WIDTH * 0.85,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 48,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 16,
        fontWeight: '400',
        color: '#666666',
        textAlign: 'center',
        lineHeight: 24,
    },
    bottomSection: {
        paddingHorizontal: 32,
        paddingBottom: 32,
        paddingTop: 16,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
    },
    activeDot: {
        width: 32,
        backgroundColor: '#000000',
    },
    buttonWrapper: {
        minHeight: 124, // 56 + 12 + 56 (altura de dos botones con gap)
        justifyContent: 'flex-end',
    },
    buttonContainer: {
        gap: 12,
    },
    singleButtonContainer: {
        // Vacío para que el botón se posicione al final del wrapper
    },
    primaryButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#000000',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.24,
    },
    secondaryButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '400',
        color: '#000000',
    },
});