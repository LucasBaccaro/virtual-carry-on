import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/CustomAlert';

type AuthStackParamList = {
    Onboarding: undefined;
    Login: undefined;
    Signup: undefined;
};

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export default function SignupScreen() {
    const navigation = useNavigation<SignupScreenNavigationProp>();
    const { signUp, setFirstLaunchComplete } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
    }>({ title: '', message: '' });

    const showAlert = (
        title: string,
        message: string,
        buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[]
    ) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };

    const handleSignup = async () => {
        if (!email || !password || !confirmPassword) {
            showAlert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('Error', 'Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            showAlert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        const { error } = await signUp(email, password);
        setLoading(false);

        if (error) {
            showAlert('Error de Registro', error.message);
        } else {
            await setFirstLaunchComplete();
            showAlert('¡Éxito!', 'Cuenta creada. Por favor verifica tu email.', [
                { text: 'OK', onPress: () => setAlertVisible(false) }
            ]);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#111111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Crear Cuenta</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Tu correo electrónico"
                            placeholderTextColor="#a9a9a9"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contraseña</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Crea una contraseña"
                                placeholderTextColor="#a9a9a9"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                style={styles.visibilityButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <MaterialIcons
                                    name={showPassword ? 'visibility-off' : 'visibility'}
                                    size={24}
                                    color="#a9a9a9"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirmar Contraseña</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Confirma tu contraseña"
                                placeholderTextColor="#a9a9a9"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                style={styles.visibilityButton}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <MaterialIcons
                                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                                    size={24}
                                    color="#a9a9a9"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.signupButtonText}>Registrarse</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.legalText}>
                        Al registrarte, aceptas nuestros{' '}
                        <Text style={styles.legalLink}>Términos</Text> y{' '}
                        <Text style={styles.legalLink}>Política de Privacidad</Text>.
                    </Text>
                </View>
            </ScrollView>

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
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111111',
        flex: 1,
        textAlign: 'center',
        letterSpacing: -0.24,
    },
    headerSpacer: {
        width: 48,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 32,
    },
    form: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111111',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 56,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#111111',
        backgroundColor: '#ffffff',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        height: 56,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#111111',
    },
    visibilityButton: {
        paddingHorizontal: 15,
        height: '100%',
        justifyContent: 'center',
    },
    bottomSection: {
        paddingVertical: 24,
    },
    signupButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#000000',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    signupButtonDisabled: {
        opacity: 0.6,
    },
    signupButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.24,
    },
    legalText: {
        fontSize: 12,
        color: '#a9a9a9',
        textAlign: 'center',
        lineHeight: 18,
    },
    legalLink: {
        fontWeight: '500',
        color: '#111111',
        textDecorationLine: 'underline',
    },
});
