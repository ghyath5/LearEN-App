import React, {useEffect, useState} from 'react'
import { Image, StyleSheet, TextInput, View, Button, Text, Linking} from 'react-native'
// import {authService} from '../services/Auth'
import CountryPicker, { Country, CountryCode} from 'react-native-country-picker-modal'
import axios from 'axios'
import { useAuth } from '../context/Auth'

export default function Auth() {
  const {login} = useAuth()
  const [name, setName] = useState('')
  const [country, setCountry] = useState<Country>()
  const [countryCode, setCountryCode] = useState<CountryCode>('LB')
  useEffect(()=>{
    axios.get('https://api.ipgeolocation.io/ipgeo?apiKey=f0c36bf6a9d8484184c51002b9182732').then(({data}:{data:any})=>{
      setCountryCode(data.country_code2)
    })
  }, [])
  return (
    <View style={{...styles.container, }}>
      <Image source={require('../../assets/logo.png')} style={{width:'70%'}} resizeMode={'contain'}/>
      <View style={{width:'70%'}}>
        <TextInput value={name} placeholderTextColor={'grey'} onChangeText={setName} placeholder={'Your name'} style={{color:'black', backgroundColor:'white', width:'100%', padding: 10}}/>
        <View style={{backgroundColor:'white', width:'100%', padding:10, marginTop:1.5}}>
          <CountryPicker
          preferredCountries={['PS','SY','LB','EG','SD']}
          excludeCountries={['IL']}
          withModal withEmoji countryCode={countryCode || 'LB'} withFilter onSelect={(country)=>{
          setCountry(country)
          setCountryCode(country.cca2)
        }} withCountryNameButton/></View>
      </View>
      <View style={{marginTop: 15, width:'70%'}}>
        <Text>Pressing ENTER mean you have read and accept <Text onPress={()=>{
          Linking.openURL('https://learen.herokuapp.com')
        }} style={{color: 'blue'}}>Terms & Conditions</Text></Text>
      </View>
      <View style={{marginTop:'4%'}}>
      <Button title={'Enter'} disabled={!countryCode || !name} onPress={()=>login({countryCode: countryCode!, name})}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  },
});