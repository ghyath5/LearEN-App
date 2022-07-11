import { StyleSheet, Text, View, Dimensions, Appearance, ActivityIndicator } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useSocket } from '../context/Socket';
import { useWebRTC } from '../context/RTC';
import { RTCView } from 'react-native-webrtc';
import { useAuth } from '../context/Auth';
import { CountryCode, FlagType, Flag } from 'react-native-country-picker-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import InCallManager from 'react-native-incall-manager';
import { Switch, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useNetInfo } from '@react-native-community/netinfo';
import { getCountryNameAsync } from 'react-native-country-picker-modal/lib/CountryService';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import { useNotification } from '../context/Notification';
const HomeScreen = () => {
  const {connecting} = useNotification()
  const colorScheme = Appearance.getColorScheme();
  const {isInternetReachable:network} = useNetInfo()
  const {width, height} = Dimensions.get('screen')
  const {iceConnectionState, localStream, partner, remoteStream, videoToggle,reset, myconn, mediaOptions,setSearching, searching} = useWebRTC()
  const {search:sendSearch, hangUp:sendHangup} = useSocket()
  const [callDuration, setCallDuration] = useState(600)
  const [searchDuration, setSearchDuration] = useState(300)
  const [micMuted, setMicMuted] = useState(false)
  const [countryName, setCountryName] = useState('Unknown')
  const {session} = useAuth()
  useEffect(()=>{
    InCallManager.setMicrophoneMute(micMuted)
  }, [micMuted])
  const isConnected = useMemo(()=>(partner?.data && partner.id && remoteStream?.active && !connecting), [partner, localStream, remoteStream, connecting])
  useEffect(()=>{    
    if(isConnected){
      setSearching(false)
      InCallManager.setForceSpeakerphoneOn(true);
      InCallManager.setSpeakerphoneOn(true);
      InCallManager.setKeepScreenOn(true)
    }
  }, [isConnected])

  const isVideo = useMemo(()=>remoteStream?.getVideoTracks()?.length, [remoteStream])
  useEffect(()=>{
    if(partner?.data?.countryCode){
      getCountryNameAsync(partner.data.countryCode as CountryCode).then((country)=>{
        setCountryName(country)
      })
    }
  }, [partner?.data?.countryCode])

  const cutText = (text:string, len=18)=>{
    return ((text).length > len) ?  (((text).substring(0,len-3)) + '...') : text
  }
  useEffect(()=>{
    if(!searching){
      return setSearchDuration(300)
    }
    const myint = setInterval(()=>{
      if(searchDuration <= 0){
        setSearchDuration(300)
        clearInterval(myint)
        setSearching(false)
        return sendHangup()
      }
      setSearchDuration((duration)=>(duration-1))
    }, 1000)
    return () =>{
      clearInterval(myint)
    }
  }, [searching, searchDuration])
  useEffect(()=>{
    setSearchDuration(300)
  }, [partner?.id])
  const connectionState = useMemo(()=>{
    if(iceConnectionState == 'completed' || iceConnectionState == 'connected'){
      return 'connected'
    }
    if(iceConnectionState == 'checking'){
      return 'checking'
    }
    return iceConnectionState
  }, [myconn, iceConnectionState])
  return (
    <View style={{flex:1, backgroundColor: colorScheme == 'dark'?'black':'white'}}>
      {isConnected ?
      <View style={{flex:1}}>
        <View style={{paddingVertical: 8, flexDirection:'row', justifyContent:'space-around', alignItems:'center', zIndex:10, backgroundColor: connectionState == 'connected' ? '#7CD820': '#FFD428'}}>
          <View style={{ flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
            <FontAwesomeIcon color={'white'} name='user-o' size={20}/>
            <Text style={{ paddingHorizontal:8, fontSize:18, color:'white', textAlign:'center',}} numberOfLines={1}>
              {cutText(partner!.data!.name!)}
            </Text>
          </View>
          <View style={{ flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
            <Flag withEmoji flagSize={25} countryCode={partner!.data!.countryCode as CountryCode} />
            <Text style={{color:'white'}}>{cutText(countryName??'')}</Text>
          </View>
        </View>
        {localStream?.active ? <RTCView style={{ width:'20%', height: '20%', position: 'absolute', bottom: 20, left: 10,}} streamURL={localStream!.toURL()} mirror zOrder={1} />:null}
        {remoteStream?.active ? <RTCView style={{ width, height, position: 'absolute'}} streamURL={remoteStream!.toURL()} mirror zOrder={5} />:null}
      </View>
      :null
      }
        {/* {localStream?.active ?  : null} */}
        {!isConnected ?
        <>
        <View style={{justifyContent:'space-around', alignItems:'center', width:'100%', height:'100%'}}>
          <View style={{justifyContent:'flex-start', alignItems:'center', width:'100%',}}>
            <Text>Learning purposes only</Text>
            <Text>Don't use it for flirting or dating</Text>
          </View>
          <View>
            {/* {searching?<Text>Searching...</Text>:null} */}
            {!searching?
            <TouchableWithoutFeedback onPress={()=>{
              if(!network || searching)return;
              setMicMuted(false)
              setSearching(true)
              sendSearch({data:session})
            }}>
              <View style={{marginTop:10,backgroundColor:'#07b2ff', justifyContent:'center', alignItems:'center', width:60, height:60, borderRadius:50}}>
                <Icon size={30} name={'search-outline'} style={{color:'white'}} />
              </View>
            </TouchableWithoutFeedback>
            :
            <View style={{alignItems:'center', justifyContent:'space-between'}}>
              <ActivityIndicator size={40} style={{top:-30,position:'relative'}} />
              <TouchableWithoutFeedback onPress={()=>{
                setMicMuted(false)
                // setSearching(true)
                // sendSearch({data:session})
              }}>
              <Text style={{padding:10}} onPress={()=>{
                setSearching(false)
                reset()
                sendHangup()
              }}>Cancel</Text>
              </TouchableWithoutFeedback>
              <Text>{new Date(searchDuration * 1000).toISOString().substring(14, 19)}</Text>
            </View>}
          </View>
          {!searching && (<View style={{justifyContent:'center', padding:20, alignItems:'center'}}>
            <Text>Camera: {mediaOptions?.video?'ON':'OFF'}</Text>
            <Switch style={{}} onValueChange={()=>{
              videoToggle()
            }} value={mediaOptions?.video}></Switch>
          </View>)}
        </View>
        </>:
        <>
        <View style={{ position:'absolute', bottom:10, width:'100%',height:'40%' , justifyContent:'space-around', alignItems:'center'}}>
          <CountdownCircleTimer
            size={90}
            isPlaying={Boolean(connectionState == 'connected' && network)}
            duration={callDuration}
            colors={['#39ff07', '#F7B801', '#A30000']}
            colorsTime={[600, 300, 0]}
            onComplete={()=>{
              setTimeout(()=>{
                sendHangup()
              }, 500)
            }}
          >
            {({ remainingTime }) => <Text style={{fontSize:15}}>
              {new Date(remainingTime * 1000).toISOString().substring(14, 19)}
            </Text>}
          </CountdownCircleTimer>
          {/* <Text>{myconn?.iceConnectionState}</Text> */}
          <View style={{flexDirection:'row',width:'100%', justifyContent:'center', alignItems:'center'}}>
            <TouchableWithoutFeedback onPress={()=>{
              sendHangup()
            }}>
              <View style={{backgroundColor:'red', justifyContent:'center', alignItems:'center', width:60, height:60, borderRadius:50}}>
                  <Icon size={30} name={'call-outline'} style={{color:'white'}} />
              </View>
            </TouchableWithoutFeedback>
            <View style={{right:15,backgroundColor:'white', position:'absolute', borderColor:'black', borderWidth:0.5, justifyContent:'center', alignItems:'center', width:40, height:40, borderRadius:50}}>
                <Icon size={30} name={micMuted?'mic-off-outline':'mic-outline'} style={{color:'black'}} onPress={()=>{
                  setMicMuted(!micMuted)
                }}/>
            </View>
          </View>
          
        </View>
        {isConnected && connectionState != 'connected' ? <Text style={{width:'100%', position:'absolute', bottom:0, padding:5, backgroundColor:'orange', textAlign:'center',color:'white'}}>Connecting...</Text>:null}
        </>
        }
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({})