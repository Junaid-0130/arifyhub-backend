import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UploadScreen from './screens/UploadScreen';
import ResultScreen from './screens/ResultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Upload">
        <Stack.Screen 
          name="Upload" 
          component={UploadScreen}
          options={{ title: 'Upload Model' }}
        />
        <Stack.Screen 
          name="Result" 
          component={ResultScreen}
          options={{ title: 'QR Code' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}



