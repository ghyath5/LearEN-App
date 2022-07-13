import axios from 'axios';
import React, {createContext, useContext, useEffect, useState} from 'react';
import { Alert, Linking, BackHandler, AppState  } from 'react-native';
import { APP_VERSION, SERVER_URL } from '../constants';

export type UpdateManagerContextData = {checking:boolean | null };
//Create the UpdateManager Context with the data type specified
//and a empty object
const UpdateManagerContext = createContext<UpdateManagerContextData>({} as UpdateManagerContextData);

const UpdateManagerProvider: React.FC = ({children}) => {
  const [checking, setChecking] = useState(true)
  useEffect(()=>{
    const subs = AppState.addEventListener('change', (state)=>{
      if(state == 'active'){
        setChecking(true)
        axios.get(`${SERVER_URL}/app-version`).then(({data}:{data:any})=>{
          if(Number(APP_VERSION) < Number(data.version) ){
            Alert.alert("Update available", "Please update this app before continue.", [
              {
                text:"Update",
                onPress:()=>{
                  Linking.openURL('https://play.google.com/store/apps/details?id=com.learen.ghyath')
                }
              },
              {
                text:"Close",
                onPress:()=>{
                  BackHandler.exitApp()
                }
              }
            ], {cancelable: false})
          }
          setChecking(false)
        }).catch(()=>{
          Alert.alert("Under maintenance", "Please again later.",[{onPress:()=>{
            
            BackHandler.exitApp()
          }}])
        })
      }   
    })
    return ( )=>{
      subs.remove()
    }
  }, [])
  return (
    //This component will be used to encapsulate the whole App,
    //so all components will have access to the Context
    <UpdateManagerContext.Provider value={{checking}}>
      {children}
    </UpdateManagerContext.Provider>
  );
};


function useUpdateManager(): UpdateManagerContextData {
  const context = useContext(UpdateManagerContext);

  if (!context) {
    throw new Error('useUpdateManager must be used within an UpdateManagerProvider');
  }

  return context;
}

export {UpdateManagerContext, UpdateManagerProvider, useUpdateManager};