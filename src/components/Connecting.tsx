import React, { useEffect, useRef, useState } from 'react';
import {View, Text, Dimensions, TouchableWithoutFeedback, Alert} from 'react-native';
import { CountryCode, Flag } from 'react-native-country-picker-modal';
import { getCountryNameAsync } from 'react-native-country-picker-modal/lib/CountryService';
import { useWebRTC } from '../context/RTC';
import Icon from 'react-native-vector-icons/Ionicons';
import { globalHangUp } from '../services/Events';

export const Connecting = ({}) => {
  const {partner} = useWebRTC()
  const [countryName, setCountryName] = useState('')
  const [timeOut, setTimeOut] = useState(30)
  const timeoutInterval = useRef<any>()
  const cutText = (text:string, len=18)=>{
    return ((text).length > len) ?  (((text).substring(0,len-3)) + '...') : text
  }
  useEffect(()=>{
    if(partner?.data?.countryCode){
      getCountryNameAsync(partner.data.countryCode as CountryCode).then((country)=>{
        setCountryName(country)
      })
    }
  }, [partner?.data?.countryCode])
  useEffect(()=>{
    timeoutInterval.current = setInterval(()=>{
      setTimeOut((timer)=>(timer-1))
    }, 1000)
    return () => {
      clearInterval(timeoutInterval.current)
    }
  }, [])
  useEffect(()=>{    
    if(timeOut<=1){
      clearInterval(timeoutInterval.current)
      globalHangUp()
      Alert.alert("Your partner has disconnected")
    }
  }, [timeOut])
  
  
  const d = Dimensions.get('screen')
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'space-around',
        alignItems:'center',
        position:'absolute',
        backgroundColor:'white',
        width: d.width,
        height:d.height,
        bottom:0
      }}>
        <View style={{justifyContent:'center', alignItems:'center'}}>
            <Text style={{fontSize:30, color: 'black'}}>{cutText(partner?.data?.name! ?? '', 25)}</Text>
            <View style={{flexDirection:'row', marginTop:10, justifyContent:'center', alignItems:'center'}}>
                <Flag withEmoji flagSize={25} countryCode={partner?.data?.countryCode as CountryCode} />
                <Text style={{color:'black'}}>{cutText(countryName??'LB', 25)}</Text>
            </View>
        </View>
        <View>
        <Text style={{color:'black'}}>Calling ...</Text>
        
        </View>
        <TouchableWithoutFeedback onPress={()=>{
            globalHangUp()
          }}>
            <View style={{backgroundColor:'red', justifyContent:'center', alignItems:'center', width:60, height:60, borderRadius:50}}>
                <Icon size={30} name={'call-outline'} style={{color:'white'}} />
            </View>
        </TouchableWithoutFeedback>
      {/* <ActivityIndicator color={'#000'} animating={true} size="small" /> */}
    </View>
  );
};