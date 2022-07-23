import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../constants';
import { AuthContextData, useAuth } from './Auth';
import {getUniqueId} from 'react-native-device-info';
import { useWebRTC } from './RTC';
import { Alert, AppState, Linking } from 'react-native';
import AsyncStorage, { useAsyncStorage } from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { useNotification } from './Notification';
import { useNetInfo } from '@react-native-community/netinfo';
import usePrevious from '../services/hooks';
import { off, on } from '../services/Events';
import { RTCSessionDescriptionType } from 'react-native-webrtc';
type InitlizeProps = {data: AuthContextData['session']}
type SocketContextData = {
  search: (props: InitlizeProps)=>void
  hangUp: ()=>void
};
//Create the Socket Context with the data type specified
//and a empty object
const SocketContext = createContext<SocketContextData>({} as SocketContextData);
const socket = io(SERVER_URL, {auth:{id: getUniqueId() },autoConnect:true, transports:['websocket'], reconnectionDelay:500 } )
const SocketProvider: React.FC = ({children}) => {
  const storage = useAsyncStorage('chats')
  const {isInternetReachable} = useNetInfo()
  const prevInternetStatus = usePrevious(isInternetReachable)
  const {setConnecting, connecting} = useNotification()
  const reconnecTimeout = useRef<string | number | NodeJS.Timeout | undefined>()
  // const {session} = useAuth()
  // const netInfo = useNetInfo();
  const {setLoading, initializer,reconnected,reconnectionTimes, iceConnectionState, remoteStream, localStream, setInitializer, myconn, createOffer, setLocalDescription, reset, startMedia, partnerConnect, addIceCandidate,handleAnswer, stopMedia, partner, setSearching} = useWebRTC()
  const isConnected = useMemo(()=>(partner?.data && partner.id && remoteStream?.active), [partner, localStream, remoteStream])
  
  useEffect(()=>{
    const subs = AppState.addEventListener('change', (state)=>{
      if(state == 'active' && !socket.connected){
        socket.connect()
      }   
    })
    return ( )=>{
      subs.remove()
    }
  }, [])
  const search = async (props:InitlizeProps) => {
    if(!socket.connected){
      socket.connect()
    }
    await startMedia()
    socket.emit('search', {...props, id: getUniqueId()})
  }
  const chats = {
    counts: async ()=>{
      let chats = await storage.getItem()
      return Number(chats ?? 0) ?? 0
    },
    inc: async function(){
      const chats = await this.counts()
      storage.setItem(String(chats+1))
    },
    reset: async ()=>{
      await storage.setItem('0')
    }
  }
  const showRate = ()=>{
    Alert.alert(
      'Are you happy with the app?',
      'Rate us on google play',
      [
        {
          text: 'Yes',
          onPress: () => {
            Linking.openURL('https://play.google.com/store/apps/details?id=com.learen.ghyath');
          },
        },
        {
          text: 'Remind me later',
          onPress: () => {}
        },
      ]
    );
  }
  const hangUp = async ()=>{
    socket.emit('hangup', {id: partner?.id})
    // setConnecting(false)
    reset()
    if(await chats.counts() >= 8){
      showRate()
      chats.reset()
    }
  }
  useEffect(()=>{
    on('hangup', hangUp)
    return ()=>{
      off('hangup', hangUp)
    }
  }, [ partner, myconn ])
  useEffect(()=>{
    myconn.onicecandidate = (event) => {      
      if (event.candidate && partner?.id && myconn.localDescription && myconn.remoteDescription) {                
        socket.emit('candidate', {candidate:event.candidate, id: partner.id})
      }
    };
  }, [partner?.id, myconn])
  
  useEffect(()=>{
    socket.on('data', async ({me})=>{
      if(!me)return;
      await startMedia()
      setSearching(true)
    })
    return ()=>{
      socket.off('data')
    }
  }, [myconn])

  useEffect(()=>{
    socket.on("connect_error", () => {
      socket.auth = {id: getUniqueId() }
      socket.connect();
    });
    return ()=>{
      socket.off('connect_error')
    }
  }, [partner?.id, myconn])
  // useEffect(()=>{
  //   myconn.oniceconnectionstatechange = ()=>{
  //     // console.log(partner?.data?.name, myconn.iceConnectionState, myconn.connectionState);
  //   }
  //   myconn.onicegatheringstatechange = () => {
  //     // console.log(partner?.data?.name, myconn.connectionState, 'gathering');
      
  //   }
  // }, [myconn, partner])
  useEffect(()=>{
    if(!prevInternetStatus && isInternetReachable && partner?.id && !['completed','connected'].includes(iceConnectionState) ){ 
      console.log('restart server from connectivity');    
      socket.connect()   
      restart(partner.id)
    }
  }, [myconn, isInternetReachable, prevInternetStatus, partner?.id, initializer, reconnectionTimes, iceConnectionState])
  
  const restart = (id:string)=>{
    if(!id){
      Alert.alert("Your partner has left the call.")
      return reset();
    }
    // console.log('trying restart server', reconnectionTimes);

    if(reconnectionTimes >= 10){
      Alert.alert("Failed to reconnect.")
      return reset();
    }
    if(!initializer && reconnectionTimes <= 5){
      reconnected(reconnectionTimes+1)
      return console.log("not me reconnect");
    }
    // console.log('restarting server');
    reconnected(reconnectionTimes+1)
    createOffer({iceRestart:true, offerToReceiveAudio:true, offerToReceiveVideo: true,}).then(async (offer)=>{
      await startMedia()
      socket.emit('calling', {offer, id})
    })
    
  }
  // useEffect(()=>{
  //   setTimeout(()=>{
  //     setReconnectedBefore(false)
  //   }, 4000)
  // }, [reconnectedBefore])
  useEffect(()=>{
    clearTimeout(reconnecTimeout.current);
    if(!partner?.id || !myconn)return;
    // console.log(iceConnectionState);
    if(iceConnectionState == 'completed' || iceConnectionState == 'connected'){
      reconnected(0)
    }
    if(iceConnectionState == 'failed'){
      reconnecTimeout.current = setTimeout(()=>restart(partner.id!), Math.floor(Math.random() * (5 - 1 + 2) + 2) * 1000 )
    }else if (iceConnectionState == 'checking'){
      reconnecTimeout.current = setTimeout(()=>restart(partner.id!), Math.floor(Math.random() * (4 - 1 + 2) + 2) * 1000)
    }
    return ()=>{ }
  }, [myconn, iceConnectionState, partner?.id, initializer, reconnectionTimes])


  useEffect(()=>{
    if((localStream?.active && remoteStream?.active) || !partner?.id){      
      setConnecting(false)
    }
  }, [myconn, partner, remoteStream, localStream])

  useEffect(()=>{
    socket.on('disconnected already', ()=>{
      if(!connecting)return;
      reset()
      Alert.alert("Your partner has already left the call.")
    })
    return ()=>{
      socket.off('disconnected already')
    }
  }, [connecting, myconn])
  useEffect(()=>{
    socket.on('hangup', ()=>{
      if(!partner?.id)return;
      reset()
      Alert.alert("Your partner has left the call.")
    })
    return ()=>{
      socket.off('hangup')
    }
  },[myconn, partner])

  useEffect(() => {
    setLoading(true)
    AsyncStorage.getItem('notify-data').then(async (data)=>{
    //  setTimeout( async ()=>{
      try{
        AsyncStorage.removeItem('notify-data')
        const parsedData = JSON.parse(data||'{}')        
        if(parsedData?.id && !isConnected){
          const parsedDetails = JSON.parse(parsedData.data||'{}')
          partnerConnect({data:parsedDetails, id: parsedData.id})
          socket.emit('get my offer', {}, async (myoffer: RTCSessionDescriptionType)=>{
            setLoading(false)
            if(!myoffer)return ;
            await startMedia()
            await handleAnswer(myoffer)
            const answer = await myconn.createAnswer();
            await setLocalDescription(answer);
            socket.emit('answer', {id: parsedData?.id, answer}, (isPartnerStillConnected:boolean)=>{
              if(!isPartnerStillConnected){
                Alert.alert("Your partner has left the call.")
                reset()
              }
            })
          })
        }else{
          setLoading(false)
        }
      }catch(e){
        setLoading(false)
        console.log(e);
      }
    //  }, 500)
    })
    messaging().subscribeToTopic(`${getUniqueId()}-call-started`)
    messaging().subscribeToTopic('online-users')
    return ()=>{
      messaging().unsubscribeFromTopic(`${getUniqueId()}-call-started`)
      messaging().unsubscribeFromTopic('online-users')
    }
  }, [myconn]);

  useEffect(()=>{
    socket.on('no longer connected', ()=>{
      reset()
      Alert.alert("Your partner has left the call.")
    })
  }, [myconn])
  useEffect(()=>{
    socket.on('candidate', (candidate)=>{
      if(!partner?.id || !myconn.remoteDescription || !myconn.localDescription || !remoteStream) return;
      // console.log(partner?.data?.name, candidate.candidate.split('typ ')[1]);
      addIceCandidate(candidate);
    })
    return ()=>{
      socket.off('candidate')
    }
  },[partner?.id, myconn,remoteStream])
  
  useEffect(()=>{
    socket.on('link', async (data)=>{
      setConnecting(true)
      partnerConnect(data)
      chats.inc()
    })
    return ()=>{
      socket.off('link')
    }
  },[])

  useEffect(()=>{
    socket.on('set answer', (data)=>{
      if(!partner?.id || partner?.id != data.id){
        return socket.emit('no longer connected', {id: data.id})
      };
      handleAnswer(data.answer)
    })
    return ()=>{
      socket.off('set answer')
    }
  },[partner?.id, myconn])

  useEffect(()=>{
    socket.on('call', async (data)=>{
      setInitializer(false)
      try{
        await handleAnswer(data.offer)
        const answer = await myconn.createAnswer();
        await setLocalDescription(answer);
        socket.emit('answer', {id: data.id, answer}, ()=>{})
      }catch(e){ }
    })
    return ()=>{
      socket.off('call')
    }
  },[myconn])
  
  useEffect(()=>{
    socket.on('call this', async (data)=>{
      setInitializer(true)
      const offer = await createOffer({ offerToReceiveAudio:true, offerToReceiveVideo: true,})
      socket.emit('calling', {offer, id: data.id})
    })
    return ()=>{
      socket.off('call this')
    }
  }, [myconn])
  useEffect(()=>{
    socket.connect()
    return ()=>{
      // socket.disconnect()
    }
  }, [isInternetReachable])
  const value = { search, hangUp}
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};


function useSocket(): SocketContextData {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useSocket must be used within an SocketProvider');
  }

  return context;
}

export {SocketContext, SocketProvider, useSocket};