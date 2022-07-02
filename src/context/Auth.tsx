import React, {createContext, useState, useContext, useEffect} from 'react';
import { authService } from '../services/Auth';

export type AuthContextData = {
  loading: boolean;
  session: {countryCode: string, name: string} | null,
  login: (data: any)=>void,
};
//Create the Auth Context with the data type specified
//and a empty object
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC = ({children}) => {
  const [session, setSession] = useState<AuthContextData['session']>(null)
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true)
    authService.getMe().then((user)=>{
      if(!user.name)return;
      setSession(user)
    }).finally(()=>{
      setLoading(false)
    })
  }, [])
  const login = async (data: React.SetStateAction<{ countryCode: string; name: string; } | null>) => {
    await authService.signIn(data)
    // navigate('')
    setSession(data)
  }
  return (
    //This component will be used to encapsulate the whole App,
    //so all components will have access to the Context
    <AuthContext.Provider value={{loading, session, login}}>
      {children}
    </AuthContext.Provider>
  );
};


function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export {AuthContext, AuthProvider, useAuth};