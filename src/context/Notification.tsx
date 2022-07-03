import React, {createContext, useContext, useEffect, useState} from 'react';
import messaging from '@react-native-firebase/messaging';
import {getUniqueId} from 'react-native-device-info';
import { Connecting } from '../components/Connecting';

export type NotificationContextData = {setConnecting:React.Dispatch<React.SetStateAction<boolean>>, connecting:boolean };
//Create the Notification Context with the data type specified
//and a empty object
const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

const NotificationProvider: React.FC = ({children}) => {
  const [connecting, setConnecting] = useState(false)
  useEffect(() => {
    messaging().subscribeToTopic(getUniqueId())
    return ()=>{
      messaging().unsubscribeFromTopic(getUniqueId())
    }
  }, []);
  return (
    //This component will be used to encapsulate the whole App,
    //so all components will have access to the Context
    <NotificationContext.Provider value={{setConnecting, connecting}}>
      {children}
      {connecting ? <Connecting />:null}
    </NotificationContext.Provider>
  );
};


function useNotification(): NotificationContextData {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within an NotificationProvider');
  }

  return context;
}

export {NotificationContext, NotificationProvider, useNotification};