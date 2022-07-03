import React from 'react';
import {NavigationContainer} from '@react-navigation/native';

import {AppStack} from './AppStack';
import {AuthStack} from './AuthStack';
import {useAuth} from '../context/Auth';
import {Loading} from '../components/Loading';
import { SocketProvider } from '../context/Socket';
import { WebRTCProvider } from '../context/RTC';
import { NotificationProvider } from '../context/Notification';

export const Router = () => {
  const {session, loading} = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  return (
    <NavigationContainer>
        {session ? 
           <WebRTCProvider>
            <NotificationProvider>
              <SocketProvider>
                    {/* // <CallProvider> */}
                      <AppStack />
                    {/* // </CallProvider> */}
              </SocketProvider>
            </NotificationProvider>
          </WebRTCProvider>
        : 
        <AuthStack />}
    </NavigationContainer>
  );
};