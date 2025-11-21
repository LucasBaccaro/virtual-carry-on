import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import WardrobeScreen from '../screens/main/WardrobeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ManageCategoriesScreen from '../screens/main/ManageCategoriesScreen';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
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
                component={ManageCategoriesScreen}
                options={{
                    tabBarLabel: 'Closet',
                    tabBarIcon: ({ color, size, focused }) => (
                        <MaterialIcons name={focused ? "checkroom" : "checkroom"} size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size, focused }) => (
                        <MaterialIcons name={focused ? "person" : "person-outline"} size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
