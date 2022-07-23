import React, { useEffect, useMemo, useRef, useState } from 'react';
import {Dimensions, View} from 'react-native';
import { Bar as ProgressBar } from 'react-native-progress';
import { globalHangUp } from '../services/Events';
const callTime = 600 // 10minutes
export const Timer = ({playing}:{playing:Boolean}) => {
  const width = Dimensions.get('screen').width
  const [callDuration, setCallDuration] = useState(callTime)
  const [callDurationTime, setCallDurationTime] = useState<number>(new Date(new Date().setSeconds(new Date().getSeconds()+callTime)).getTime() / 1000);
  const myInterval = useRef<string | number | NodeJS.Timeout | undefined>()
  const timeNow = ()=> (new Date().getTime() / 1000);
  const differenceTime = () => callDurationTime - timeNow()
  useEffect(()=>{
    setCallDurationTime(new Date(new Date().setSeconds(new Date().getSeconds()+callTime)).getTime() / 1000)
    setCallDuration(callTime)
  }, [])
  useEffect(()=>{
    myInterval.current = setInterval(()=>{
        if(!playing){
          return setCallDurationTime((Time)=>Time+1)
        };
        setCallDuration((dur)=>callDurationTime - timeNow())
        
    }, 1000)
    return ()=>{
        // setCallDuration(callTime)
        clearInterval(myInterval.current)
    }
  }, [playing])
  useEffect(()=>{
    if(callDuration <= 0){
        globalHangUp()
        setCallDurationTime(new Date(new Date().setSeconds(new Date().getSeconds()+callTime)).getTime() / 1000)
        setCallDuration(callTime)
    }
  }, [callDurationTime,callDuration])
  const color = useMemo(()=>callDurationTime >= 300 ? 'lightgreen' :  callDurationTime >= 90 ? 'orange':'red', [callDurationTime])

  return (
    <View
      style={{
        width:'100%',
      }}>
        {/* <View style={{position:'absolute', left:0, top: 0}}> */}
        <ProgressBar 
        // style={{transform:[{rotate:'90deg'}]}} 
        color={color}
        borderRadius={0}
        borderWidth={0} 
        height={10}
        progress={(differenceTime() * 100 / callTime) / 100} width={width}/>
        {/* </View> */}
        {/* <View style={{backgroundColor:'green', height:'100%', width:10, position:'absolute', left:0, top:0}}></View>
        <View style={{backgroundColor:'green', height:10, width:'100%', position:'absolute', left:0, top:0}}></View>
        <View style={{backgroundColor:'green', height:10, width:'100%', position:'absolute', left:0, bottom:0}}></View> */}
    </View>
  );
};