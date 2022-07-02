import React, { useEffect } from 'react';
import {Router} from './src/navigator/navigator';
import {AuthProvider} from './src/context/Auth';
import { HintProvider } from './src/context/Hint';
import { UpdateManagerProvider } from './src/context/UpdateManager';

const App = () => {
 
  return (
    // <SafeAreaView style={{flex:1, paddingTop:30}}>
    // <NetworkProvider>
    <UpdateManagerProvider>
      <HintProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </HintProvider>
    </UpdateManagerProvider>
    // </NetworkProvider>
    // </SafeAreaView>
  );
};

export default App;