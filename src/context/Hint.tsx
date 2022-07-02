import { useNetInfo } from '@react-native-community/netinfo';
import React, {createContext, useContext} from 'react';
import { Text, View } from 'react-native';

export type HintContextData = {isInternetReachable:boolean | null };
//Create the Hint Context with the data type specified
//and a empty object
const HintContext = createContext<HintContextData>({} as HintContextData);

const HintProvider: React.FC = ({children}) => {
  const {isInternetReachable} = useNetInfo()
  return (
    //This component will be used to encapsulate the whole App,
    //so all components will have access to the Context
    <HintContext.Provider value={{isInternetReachable}}>
      {!isInternetReachable ? 
        <View style={{padding: 10, backgroundColor:'#f43d3d'}}>
        <Text style={{color:'white'}}>Reconnecting ...</Text>
      </View>:null}
      {children}
    </HintContext.Provider>
  );
};


function useHint(): HintContextData {
  const context = useContext(HintContext);

  if (!context) {
    throw new Error('useHint must be used within an HintProvider');
  }

  return context;
}

export {HintContext, HintProvider, useHint};