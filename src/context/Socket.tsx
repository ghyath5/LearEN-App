import React, {createContext, useContext, useEffect, useMemo, useRef} from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../constants';
import { AuthContextData, useAuth } from './Auth';
import {getUniqueId} from 'react-native-device-info';
import { useWebRTC } from './RTC';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {  RTCSessionDescriptionType } from 'react-native-webrtc';
import { useNotification } from './Notification';
type InitlizeProps = {data: AuthContextData['session']}
type SocketContextData = {
  search: (props: InitlizeProps)=>void
  hangUp: ()=>void
};
//Create the Socket Context with the data type specified
//and a empty object
const SocketContext = createContext<SocketContextData>({} as SocketContextData);
const socket = io(SERVER_URL, {auth:{id: getUniqueId() } } )
const SocketProvider: React.FC = ({children}) => {
  const {setConnecting} = useNotification()
  const {session} = useAuth()
  // const netInfo = useNetInfo();
  const { searching, initializer, remoteStream, localStream, setInitializer, myconn, createOffer, setLocalDescription, reset, startMedia, partnerConnect, addIceCandidate,handleAnswer, stopMedia, partner, setSearching} = useWebRTC()
  const isConnected = useMemo(()=>(partner?.data && partner.id && remoteStream?.active), [partner, localStream, remoteStream])
  const search = async (props:InitlizeProps) => {
    // reset()
    stopMedia()
    await startMedia()
    socket.emit('search', {...props, id: getUniqueId()})
  }
  const hangUp = ()=>{
    socket.emit('hangup', {id: partner?.id})
    reset()
  }
  useEffect(()=>{
    myconn.onicecandidate = (event) => {      
      if (event.candidate && partner?.id) {                
        socket.emit('candidate', {candidate:event.candidate, id: partner.id})
      }
    };
  }, [partner?.id, myconn])
  const connectionLost = () => {
    reset()
    Alert.alert('Connection lost.')
  }
  useEffect(()=>{
    socket.on('data', ({me})=>{
      if(!me)return;
      setSearching(true)
    })
    return ()=>{
      socket.off('data')
    }
  }, [])
  useEffect(()=>{
  //   socket.io.on("reconnect_attempt", () => {
  //     console.log(session?.name,'reconnect_attempt');
  //   });
    socket.on("connect_error", () => {
      socket.auth = {id: getUniqueId() }
      socket.connect();
    });
    return ()=>{
      // socket.off('connect')
      // socket.off('disconnect')
      // socket.off('reconnect')
      socket.off('connect_error')
      // socket.off('reconnect_attempt')
    }
  }, [partner?.id, myconn,session?.name,initializer])
  useEffect(()=>{
    if(!initializer || !partner?.id || !myconn)return;
    myconn.oniceconnectionstatechange = ()=>{      
      if(initializer && partner?.id && (myconn.iceConnectionState == 'failed' || myconn.connectionState == 'failed')){
        createOffer({iceRestart: true, offerToReceiveAudio:true, offerToReceiveVideo: true}).then((offer)=>{
          socket.emit('calling', {offer, id: partner.id})
        })
        // reconnected()
      }
    }
    return ()=>{ }
  }, [myconn, partner?.id, initializer])
  // useEffect(()=>{
  //   socket.connect()
  //   return ()=>{

  //   }
  // }, [netInfo.isConnected])
  useEffect(()=>{
    socket.on('hangup', ()=>{
      reset()
    })
    return ()=>{
      socket.off('hangup')
    }
  },[myconn, session])

  useEffect(() => {
    AsyncStorage.getItem('notify-data').then(async (data)=>{
      try{
        AsyncStorage.removeItem('notify-data')
        const parsedData = JSON.parse(data||'{}')        
        if(parsedData?.id && !isConnected){
          setConnecting(true)
          const parsedDetails = JSON.parse(parsedData.data||'{}')
          partnerConnect({data:parsedDetails, id: parsedData.id})
          socket.emit('get my offer', {}, async (myoffer: RTCSessionDescriptionType)=>{            
            if(!myoffer)return;
            await startMedia()
            await handleAnswer(myoffer)
            const answer = await myconn.createAnswer();
            await setLocalDescription(answer);
            socket.emit('answer', {id: parsedData?.id, answer})
            setConnecting(false)
          })
        }else{
          setConnecting(false)
        }
      }catch(e){
        console.log(e);
      }
    })
    messaging().subscribeToTopic(`${getUniqueId()}-call-started`)
    return ()=>{
      messaging().unsubscribeFromTopic(`${getUniqueId()}-call-started`)
    }
  }, [myconn,isConnected]);
  useEffect(()=>{
    socket.on('candidate', (candidate)=>{
      if(!partner?.id) return;
      addIceCandidate(candidate);
    })
    return ()=>{
      socket.off('candidate')
    }
  },[partner?.id, myconn])

  useEffect(()=>{
    socket.on('link', (data)=>{
      setConnecting(true)
      partnerConnect(data)
    })
    return ()=>{
      socket.off('link')
    }
  },[])
  useEffect(()=>{
    socket.on('set answer', (data)=>{
      if(!partner?.id || partner?.id != data.id)return;
      setConnecting(false)
      handleAnswer(data.answer)
    })
    return ()=>{
      socket.off('set answer')
    }
  },[partner?.id, myconn])

  useEffect(()=>{
    socket.on('call', async (data)=>{
      if(!searching)return;      
      await handleAnswer(data.offer)
      const answer = await myconn.createAnswer();
      await setLocalDescription(answer);
      socket.emit('answer', {id: data.id, answer})
      setConnecting(false)
    })
    return ()=>{
      socket.off('call')
    }
  },[myconn, searching])
  
  useEffect(()=>{
    socket.on('call this', async (data)=>{
      setInitializer(true)
      const offer = await createOffer({ offerToReceiveAudio:true, offerToReceiveVideo: true})
      socket.emit('calling', {offer, id: data.id})
    })
    return ()=>{
      socket.off('call this')
    }
  }, [myconn])
  useEffect(()=>{
    if(!socket.connected){
      socket.connect()
    }
  }, [myconn])
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