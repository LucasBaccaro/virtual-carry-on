import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import WardrobeScreen from '../screens/main/WardrobeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ManageCategoriesScreen from '../screens/main/ManageCategoriesScreen';
import ClosetScreen from '../screens/main/ClosetScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#000000',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Outfits',
                    tabBarIcon: ({ color, size, focused }) => (
                        <MaterialIcons name={focused ? "style" : "style"} size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Wardrobe"
                component={WardrobeScreen}
                options={{
                    tabBarLabel: 'Create',
                    tabBarIcon: ({ color, size, focused }) => (
                        <MaterialIcons name={focused ? "add-circle" : "add-circle-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Closet"
                component={ClosetScreen}
                options={{
                    tabBarLabel: 'Closet',
                    tabBarIcon: ({ color, size, focused }) => (
                        <MaterialIcons name={focused ? "checkroom" : "checkroom"} size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function MainNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ManageCategories" component={ManageCategoriesScreen} />
        </Stack.Navigator>
    );
}
