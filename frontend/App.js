import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/constants/colors';

export default function App() {
  return (
    <>
      <AppNavigator />
      <StatusBar style="dark" backgroundColor={colors.white} />
    </>
  );
}
