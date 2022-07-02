import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import HomeScreen from '../screens/Home';

const Stack = createStackNavigator();

export const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{header:()=>null}}>
      <Stack.Screen name="Home Screen"  component={HomeScreen} />
    </Stack.Navigator>
  );
};