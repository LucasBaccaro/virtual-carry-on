import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { UserPhotoProvider } from './src/context/UserPhotoContext';
import { OutfitProvider } from './src/context/OutfitContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserPhotoProvider>
          <OutfitProvider>
            <AppNavigator />
          </OutfitProvider>
        </UserPhotoProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
