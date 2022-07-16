import { StyleSheet, Text, View, Dimensions, Appearance, ActivityIndicator } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useSocket } from '../context/Socket';
import { useWebRTC } from '../context/RTC';
import { RTCView } from 'react-native-webrtc';
import { useAuth } from '../context/Auth';
import { CountryCode, Flag } from 'react-native-country-picker-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import InCallManager from 'react-native-incall-manager';
import { Switch, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useNetInfo } from '@react-native-community/netinfo';
import { getCountryNameAsync } from 'react-native-country-picker-modal/lib/CountryService';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import { useNotification } from '../context/Notification';
import LottieView from "lottie-react-native";
import { Timer } from '../components/Timer';
const HomeScreen = () => {
  const {connecting} = useNotification()
  const colorScheme = Appearance.getColorScheme();
  const {isInternetReachable:network} = useNetInfo()
  const {width, height} = Dimensions.get('screen')
  const {iceConnectionState, localStream, partner, remoteStream, videoToggle,reset, myconn, mediaOptions,setSearching, searching} = useWebRTC()
  const {search:sendSearch, hangUp:sendHangup} = useSocket()
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
      InCallManager.start({media: 'video'});
    }else{
      InCallManager.stop()
    }
    InCallManager.setForceSpeakerphoneOn(true)
    InCallManager.setKeepScreenOn(true)
    InCallManager.setSpeakerphoneOn(true)
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
      <View>
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
        <Timer playing={Boolean(connectionState == 'connected' && network)} />
        {/* <View> */}
          {localStream?.active ? <RTCView style={{ width:'20%', height: '20%', position: 'absolute', bottom: 20, left: 10,}} streamURL={localStream!.toURL()} mirror zOrder={1} />:null}
          {remoteStream?.active ? <RTCView style={{ width, height, position: 'absolute'}} streamURL={remoteStream!.toURL()} mirror zOrder={5} />:null}
        {/* </View> */}
      </View>
      :null
      }
        {/* {localStream?.active ?  : null} */}
        {!isConnected ?
        <>
        <View style={{ alignItems:'center', width:'100%', height:'100%'}}>
          
          <View style={{flex:0.8, width:'100%',}}>
          <LottieView
          // autoSize
          speed={searching?2:0.8}
            style={{height:'100%',}}
            source={require('../../assets/84875-world-map-pinging-and-searching.json')}
            autoPlay
            loop
          />
          </View>
        
          <View style={{flex:1}}>
            {/* {searching?<Text>Searching...</Text>:null} */}
            {!searching?
            <View style={{flex:1, justifyContent:'space-around'}}>
            <TouchableWithoutFeedback style={{justifyContent:'center', alignItems:'center'}} onPress={async ()=>{
              if(!network || searching)return;
              setMicMuted(false)
              setSearching(true)
              sendSearch({data:session})
            }}>
              <View style={{backgroundColor:'#07b2ff',marginBottom:10, justifyContent:'center', alignItems:'center', padding:10, borderRadius:5}}>
                {/* <Icon size={30} name={'search-outline'} style={{color:'white'}} /> */}
                
                <Text style={{fontSize:18, color: 'white', marginBottom:5}}>Find a Speaker</Text>
                <MaterialIcon name='cast-audio-variant' size={25} color={'white'}/>
              </View>
              {/* <View style={{backgroundColor:'#07b2ff',flexDirection:'row', justifyContent:'center', alignItems:'center', padding:10, borderRadius:5}}>
                
                <Text style={{fontSize:18, color: 'white', marginRight:5}}>Find a Speaker</Text>
                <MaterialIcon name='cast-audio-variant' size={20} color={'white'}/>
              </View> */}
            </TouchableWithoutFeedback>
            <View style={{alignItems:'center', }}>
              <Text>Camera: {mediaOptions?.video?'ON':'OFF'}</Text>
              <Switch style={{}} onValueChange={()=>{
                videoToggle()
              }} value={mediaOptions?.video}></Switch>
            </View>
            </View>
            :
            <View style={{flex:1,alignItems:'center'}}>
              
              <LottieView
                style={{height:250}}
                // autoSize
                source={require('../../assets/41252-searching-radius.json')}
                autoPlay
                loop
              />
              <TouchableWithoutFeedback onPress={()=>{
                setMicMuted(false)
                // setSearching(true)
                // sendSearch({data:session})
              }}>
              <Text style={{padding:10}} onPress={()=>{
                setSearching(false)
                sendHangup()
              }}>Cancel</Text>
              </TouchableWithoutFeedback>
              <Text>{new Date(searchDuration * 1000).toISOString().substring(14, 19)}</Text>
            </View>}
          </View>
          <View style={{padding:10, alignItems:'center'}}>
              <Text>Learning purposes only</Text>
              <Text>Don't use it for flirting or dating</Text>
          </View>
        </View>
        </>:
        <>
        <View style={{flex:1, justifyContent:'center', alignItems:'center', }}>
        {!isVideo ? <Text style={{color:'gray', fontSize:18}}>This section coming soon.</Text>:null}
        </View>
        <View style={{ position:'absolute', bottom:0, width:'100%',height:'20%' , justifyContent:'space-around', alignItems:'center'}}>        
          
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