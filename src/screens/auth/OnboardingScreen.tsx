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
        // User will provide this image
        image: require('../../../assets/images/onboarding-1.png'),
        title: 'Bienvenido a SmartFit',
        description: 'Descubre cómo se verán tus outfits antes de usarlos',
    },
    {
        id: 2,
        // User will provide this image
        image: require('../../../assets/images/onboarding-2.png'),
        title: 'Prueba Virtual',
        description: 'Prueba diferentes combinaciones con tu foto',
    },
    {
        id: 3,
        // User will provide this image
        image: require('../../../assets/images/onboarding-3.png'),
        title: 'Guarda tus Favoritos',
        description: 'Organiza y guarda tus outfits favoritos',
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
        navigation.replace('Login');
    };

    const isLastSlide = currentIndex === onboardingData.length - 1;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

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
            >
                {onboardingData.map((item) => (
                    <View key={item.id} style={styles.slide}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={item.image}
                                style={styles.image}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Bottom Section */}
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

                {/* Action Button */}
                {isLastSlide ? (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleGetStarted}
                    >
                        <Text style={styles.actionButtonText}>Comenzar</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
                        <Text style={styles.actionButtonText}>Siguiente</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 16,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '400',
        color: '#111111',
    },
    scrollView: {
        flex: 1,
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: 32,
    },
    image: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
    },
    textContainer: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111111',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 16,
        fontWeight: '400',
        color: '#616189',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 16,
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
        width: 24,
        backgroundColor: '#111111',
    },
    actionButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#111111',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 0.24,
    },
});
