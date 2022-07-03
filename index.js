/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  AsyncStorage.setItem('notify-data', JSON.stringify({...remoteMessage.data, time: remoteMessage.sentTime}))
});

AppRegistry.registerComponent(appName, () => App);
