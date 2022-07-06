import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useState, useContext, useEffect} from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
  RTCSessionDescriptionType,
  RTCIceCandidateType,
  RTCOfferOptions,
} from 'react-native-webrtc';
// import { socketEvent } from '../services/Events';

type WebRTCContextData = {
  myconn: RTCPeerConnection,
  initializer: boolean,
  setInitializer: React.Dispatch<React.SetStateAction<boolean>>
  handleAnswer: (answer: RTCSessionDescriptionType) =>Promise<void>,
  createOffer:(options: RTCOfferOptions | undefined)=>Promise<RTCSessionDescriptionType>, 
  startMedia: ()=>Promise<MediaStream>,
  videoToggle:()=>void, 
  stopMedia:()=>void, 
  reset:()=>RTCPeerConnection, 
  partnerConnect:(partnerData:any)=>void,
  partnerDisconnect:()=>void,
  setLocalDescription:(offer: RTCSessionDescriptionType) =>Promise<void>,
  addIceCandidate:(candidate:RTCIceCandidateType)=>void,
  localStream: MediaStream| undefined,
  remoteStream: MediaStream| undefined,
  reconnectionTimes: number,
  reconnected:()=>void, 
  mediaOptions: { audio: boolean, video: boolean },
  partner:{data?:{countryCode?: string, name?: string}, id?: string} | undefined
  setSearching: React.Dispatch<React.SetStateAction<boolean>>,
  searching: boolean
}
//Create the WebRTC Context with the data type specified
//and a empty object
const WebRTCContext = createContext<WebRTCContextData>({} as WebRTCContextData);
const RTC_PEER = () =>{
  return new RTCPeerConnection({
    iceTransportPolicy:'all',
    iceServers: [
      {
        username: "nwNMneiGkZ_kydK2jl9YI-CPrZI9CuIDDSPCpOWgkCT81ejg4VKNTpl3dHYBKcBHAAAAAGLFxS5naHlhdGg=",
        credential: "6b89ae16-fd50-11ec-99aa-0242ac120004",
        urls: [
            "turn:fr-turn1.xirsys.com:80?transport=udp",
            "turn:fr-turn1.xirsys.com:3478?transport=udp",
            "turn:fr-turn1.xirsys.com:80?transport=tcp",
            "turn:fr-turn1.xirsys.com:3478?transport=tcp",
            "turns:fr-turn1.xirsys.com:443?transport=tcp",
            "turns:fr-turn1.xirsys.com:5349?transport=tcp"
        ]
     },
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun2.l.google.com:19302'
        ], 
      }
    ],
  })
}
const WebRTCProvider: React.FC = ({children}) => {
  const [initializer, setInitializer] = useState(false)
  const [reconnectionTimes, setReconnectionTimes] = useState(0)
  const [partner, setPartner] = useState<{data?:{countryCode?: string, name?: string}, id?: string}>()
  const [myconn, setMyconn] = useState<RTCPeerConnection>(RTC_PEER())
  const [searching, setSearching] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream>()
  const [remoteStream, setRemoteStream] = useState<MediaStream>()
  const [mediaOptions, setMediaOptions] = useState({ audio: true, video: false })
  const reconnected = () =>{
    setReconnectionTimes((reconnections)=>reconnections+1)
  }
  const videoToggle = () =>{
    setMediaOptions ((op)=>{
      AsyncStorage.setItem('camera', op.video?'OFF':'ON');
      return ({...op, video: !op.video})
    })
  }
  useEffect(()=>{
    AsyncStorage.getItem('camera').then((camera)=>{
      setMediaOptions((op)=>({...op, video: camera == 'ON'}))
    })
  }, [])
  const reset = () => {
    let mynewConn = RTC_PEER()
    setReconnectionTimes(0)
    myconn.close()
    setLocalStream(undefined)
    setRemoteStream(undefined)
    setSearching(false)
    setPartner(undefined)
    setMyconn(mynewConn)
    return mynewConn
    // socketEvent.emit('call-reset')
  }
  const startMedia = async () => {
    let camera = await AsyncStorage.getItem('camera')
    const media = await mediaDevices.getUserMedia({...mediaOptions, video: camera == 'ON'})
    setLocalStream(media);
    myconn.addStream(media)
    return media;
  }
  const stopMedia = async () => {
    localStream?.release()
  }
  const createOffer = (options:RTCOfferOptions | undefined):Promise<RTCSessionDescriptionType> => {
    return new Promise<RTCSessionDescriptionType>((resolve)=>{
      myconn.createOffer(options).then((offer) => {
        myconn.setLocalDescription(offer as RTCSessionDescription).then(() => {
          return resolve(offer)
        });
      });
    })
  }
  const handleAnswer = (answer:RTCSessionDescriptionType) => {
    return myconn.setRemoteDescription(new RTCSessionDescription(answer));
  };
  const setLocalDescription = (offer: RTCSessionDescriptionType) => {
    return myconn.setLocalDescription(offer)
  }
  const partnerConnect = (partnerData: { data: { countryCode?: string; name?: string; }; id: string;}) => {
    setPartner(partnerData)
  }
  const partnerDisconnect = () => {
    setPartner(undefined)
  }
  const addIceCandidate = ( candidate: RTCIceCandidateType) => {
    myconn.addIceCandidate(new RTCIceCandidate(candidate))
  }
  useEffect(()=>{
    myconn.onaddstream = (event) => {
      setRemoteStream(event.stream);
    };
    // myconn.onconnectionstatechange = (e)=>{
    //   console.log(partner?.data?.name, myconn.connectionState);
    // }
  }, [myconn, partner?.id])

  return (
    //This component will be used to encapsulate the whole App,
    //so all components will have access to the Context
    <WebRTCContext.Provider value={{setSearching, searching,mediaOptions, videoToggle, reconnected, reconnectionTimes, initializer, setInitializer, myconn, handleAnswer, createOffer, startMedia, stopMedia, reset, partnerConnect, partnerDisconnect, addIceCandidate, setLocalDescription , localStream, remoteStream, partner}}>
      {children}
    </WebRTCContext.Provider>
  );
};


function useWebRTC(): WebRTCContextData {
  const context = useContext(WebRTCContext);

  if (!context) {
    throw new Error('useWebRTC must be used within an WebRTCProvider');
  }

  return context;
}

export {WebRTCContext, WebRTCProvider, useWebRTC};