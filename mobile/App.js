// Mobile App - React Native Entry Point
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthContext } from './context/AuthContext';
import WalletConnectProvider from './services/WalletConnectService';

// Screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import MarketplaceScreen from './screens/marketplace/MarketplaceScreen';
import DetailScreen from './screens/marketplace/DetailScreen';
import ProfileScreen from './screens/profile/ProfileScreen';
import WalletScreen from './screens/wallet/WalletScreen';
import SettingsScreen from './screens/settings/SettingsScreen';
import RentalScreen from './screens/rental/RentalScreen';
import BridgeScreen from './screens/bridge/BridgeScreen';
import StakingScreen from './screens/staking/StakingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Auth Stack - For unauthenticated users
 */
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' }
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

/**
 * Marketplace Stack - For marketplace browsing and details
 */
function MarketplaceStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="MarketplaceList"
        component={MarketplaceScreen}
        options={{ title: 'Marketplace' }}
      />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ title: 'NFT Details' }}
      />
    </Stack.Navigator>
  );
}

/**
 * Rental Stack - For NFT rental operations
 */
function RentalStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="RentalList"
        component={RentalScreen}
        options={{ title: 'Rental Marketplace' }}
      />
    </Stack.Navigator>
  );
}

/**
 * Wallet Stack - For wallet and transactions
 */
function WalletStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="WalletMain"
        component={WalletScreen}
        options={{ title: 'Wallet' }}
      />
      <Stack.Screen
        name="Bridge"
        component={BridgeScreen}
        options={{ title: 'Cross-Chain Bridge' }}
      />
      <Stack.Screen
        name="Staking"
        component={StakingScreen}
        options={{ title: 'NFT Staking' }}
      />
    </Stack.Navigator>
  );
}

/**
 * Profile Stack - For user profile and settings
 */
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
}

/**
 * App Stack - For authenticated users
 */
function AppStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#f9f9f9',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceStack}
        options={{
          tabBarLabel: 'Market',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shopping" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="RentalTab"
        component={RentalStack}
        options={{
          tabBarLabel: 'Rent',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="domain" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletStack}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          )
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root Navigator - Main app entry point
 */
function RootNavigator() {
  const { state, bootstrapAsync } = React.useContext(AuthContext);

  React.useEffect(() => {
    const bootstrapAsync = async () => {
      let initialRoute = 'Splash';
      try {
        // Restore token
        let userToken;
        try {
          userToken = await AsyncStorage.getItem('userToken');
        } catch (e) {
          // Restoring token failed
        }

        if (userToken) {
          initialRoute = 'App';
        }
      } catch (e) {
        // Ignore
      }
    };

    bootstrapAsync();
  }, []);

  if (state.isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {state.isSignedIn ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

/**
 * Main App Component
 */
export default function App() {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
            isSignedIn: !!action.token,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignedIn: true,
            userToken: action.token,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignedIn: false,
            userToken: null,
          };
      }
    },
    {
      isLoading: true,
      isSignedIn: false,
      userToken: null,
    }
  );

  const authContext = React.useMemo(
    () => ({
      restoreToken: async () => {
        let userToken;
        try {
          userToken = await AsyncStorage.getItem('userToken');
        } catch (e) {
          // Ignore
        }

        dispatch({ type: 'RESTORE_TOKEN', token: userToken });
      },
      signIn: async (credentials) => {
        // Sign in logic
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        const data = await response.json();
        
        await AsyncStorage.setItem('userToken', data.token);
        dispatch({ type: 'SIGN_IN', token: data.token });
      },
      signOut: async () => {
        await AsyncStorage.removeItem('userToken');
        dispatch({ type: 'SIGN_OUT' });
      },
      signUp: async (credentials) => {
        // Sign up logic
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        const data = await response.json();
        
        await AsyncStorage.setItem('userToken', data.token);
        dispatch({ type: 'SIGN_IN', token: data.token });
      },
      state,
    }),
    [state]
  );

  return (
    <PaperProvider>
      <WalletConnectProvider>
        <AuthContext.Provider value={authContext}>
          <RootNavigator />
          <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        </AuthContext.Provider>
      </WalletConnectProvider>
    </PaperProvider>
  );
}
