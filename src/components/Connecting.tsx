import React, { useEffect, useState } from 'react';
import {View, Text, Dimensions} from 'react-native';
import { CountryCode, Flag } from 'react-native-country-picker-modal';
import { getCountryNameAsync } from 'react-native-country-picker-modal/lib/CountryService';
import { useWebRTC } from '../context/RTC';

export const Connecting = ({}) => {
  const {partner} = useWebRTC()
  const [countryName, setCountryName] = useState('')
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
            <Text style={{fontSize:30}}>{cutText(partner?.data?.name! ?? '', 25)}</Text>
            <View style={{flexDirection:'row', marginTop:10, justifyContent:'center', alignItems:'center'}}>
                <Flag withEmoji flagSize={25} countryCode={partner?.data?.countryCode as CountryCode} />
                <Text style={{color:'black'}}>{cutText(countryName??'LB', 25)}</Text>
            </View>
        </View>
        <Text style={{color:'black'}}>Calling ...</Text>
      {/* <ActivityIndicator color={'#000'} animating={true} size="small" /> */}
    </View>
  );
};