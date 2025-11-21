import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    isFirstLaunch: boolean;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    setFirstLaunchComplete: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FIRST_LAUNCH_KEY = '@SmartFit:firstLaunch';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFirstLaunch, setIsFirstLaunch] = useState(true);

    useEffect(() => {
        // Check first launch status
        checkFirstLaunch();

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkFirstLaunch = async () => {
        try {
            const value = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
            setIsFirstLaunch(value === null);
        } catch (error) {
            console.error('Error checking first launch:', error);
        }
    };

    const setFirstLaunchComplete = async () => {
        try {
            await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
            setIsFirstLaunch(false);
        } catch (error) {
            console.error('Error setting first launch:', error);
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            return { error: error ? new Error(error.message) : null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            return { error: error ? new Error(error.message) : null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const value = {
        session,
        user,
        isLoading,
        isFirstLaunch,
        signUp,
        signIn,
        signOut,
        setFirstLaunchComplete,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
