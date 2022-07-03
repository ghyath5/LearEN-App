import AsyncStorage from '@react-native-async-storage/async-storage'
export type AuthData = {
    user: any
};
const signIn = async (data: any) => {
  return await AsyncStorage.setItem('me', JSON.stringify(data))
};
const getMe = async () => {
    return JSON.parse(await AsyncStorage.getItem('me') || '{}')
}
export const authService = {
  signIn,
  getMe
};