import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';
import AIScreen from './src/screens/AIScreen';
import BrowserScreen from './src/screens/BrowserScreen';
import AccountScreen from './src/screens/AccountScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#1a1a2e' }, headerTintColor: '#a78bfa', headerTitleStyle: { fontWeight: '700' } }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Nova' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Nova Search' }} />
        <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
        <Stack.Screen name="AI" component={AIScreen} options={{ title: 'Nova AI' }} />
        <Stack.Screen name="Browser" component={BrowserScreen} options={{ title: 'Browse' }} />
        <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Nova Account' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
