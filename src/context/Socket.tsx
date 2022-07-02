import React, {createContext, useContext, useEffect, useMemo, useRef} from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../constants';
import { AuthContextData, useAuth } from './Auth';
import {getUniqueId} from 'react-native-device-info';
import { useWebRTC } from './RTC';
import { Alert } from 'react-native';
import { useHint } from './Hint';
// import { useNetInfo } from '@react-native-community/netinfo';
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
  const {session} = useAuth()
  // const netInfo = useNetInfo();
  const { searching, initializer, setInitializer, myconn, createOffer, setLocalDescription, reset, startMedia, partnerConnect, addIceCandidate,handleAnswer, stopMedia, partner} = useWebRTC()

  
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
      if (event.candidate && partner?.id ) {        
        socket.emit('candidate', {candidate:event.candidate, id: partner.id})
      }
    };
  }, [partner?.id, myconn])
  const connectionLost = () => {
    reset()
    Alert.alert('Connection lost.')
  }
  useEffect(()=>{
  //   socket.io.on("reconnect_attempt", () => {
  //     console.log(session?.name,'reconnect_attempt');
  //   });
    socket.on("connect_error", () => {
      socket.auth = {id: getUniqueId() }
      socket.connect();
    });
  //   socket.io.on("reconnect", async () => {
  //     console.log(session?.name,'connected');
      
  //     if(initializer && partner?.id && (myconn.iceConnectionState == 'failed' || myconn.connectionState == 'failed')){
        
  //       console.log('sending restart interval');
  //       const offer = await createOffer({iceRestart: true, offerToReceiveAudio:true, offerToReceiveVideo: true})          
  //       socket.emit('calling', {offer, id: partner.id})
  //       // reconnected()
  //     }
  //   });
  //   socket.on("connect", () => {
  //     console.log(session?.name,'socket reconnected');
      
  //   });
  //   socket.on("disconnect", (reason) => {
  //     console.log('disconnected');
      
  //   });
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
        
        console.log('sending restart interval', myconn.signalingState);
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

  // useEffect(()=>{
  //   socket.on('users', (users)=>{
  //     setUsersCount
  //   })
  //   return ()=>{
  //     socket.off('users')
  //   }
  // },[partner?.id, myconn])
  useEffect(()=>{
    socket.on('candidate', (candidate)=>{
      if(!partner?.id)return;
      addIceCandidate(candidate);
    })
    return ()=>{
      socket.off('candidate')
    }
  },[partner?.id, myconn])

  useEffect(()=>{
    socket.on('link', (data)=>{
      partnerConnect(data)
    })
    return ()=>{
      socket.off('link')
    }
  },[])

  useEffect(()=>{
    socket.on('set answer', (data)=>{
      if(!partner?.id || !searching)return;
      handleAnswer(data.answer)
    })
    return ()=>{
      socket.off('set answer')
    }
  },[partner?.id, myconn, searching])

  useEffect(()=>{
    socket.on('call', async (data)=>{
      if(!searching)return;      
      await handleAnswer(data.offer)
      const answer = await myconn.createAnswer();
      await setLocalDescription(answer);
      socket.emit('answer', {id: data.id, answer})
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
  }, [myconn, session])
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