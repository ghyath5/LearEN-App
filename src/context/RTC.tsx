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
export type IceConnectionStateType = 'checking' | 'completed' | 'connected' | 'disconnected' | 'new' | 'closed' | 'failed'
type WebRTCContextData = {
  myconn: RTCPeerConnection,
  initializer: boolean,
  setInitializer: React.Dispatch<React.SetStateAction<boolean>>
  handleAnswer: (answer: RTCSessionDescriptionType) =>Promise<void>,
  createOffer:(options: RTCOfferOptions | undefined)=>Promise<RTCSessionDescriptionType>, 
  startMedia: ()=>Promise<MediaStream>,
  videoToggle:()=>void, 
  stopMedia:()=>void, 
  reset:()=>void, 
  restartNewConnection:()=>void, 
  partnerConnect:(partnerData:any)=>void,
  setLoading:(is:boolean)=>void,
  partnerDisconnect:()=>void,
  setLocalDescription:(offer: RTCSessionDescriptionType) =>Promise<void>,
  addIceCandidate:(candidate:RTCIceCandidateType)=>void,
  localStream: MediaStream| undefined,
  remoteStream: MediaStream| undefined,
  reconnectionTimes: number,
  reconnected:(times: number)=>void, 
  mediaOptions: { audio: boolean, video: boolean },
  partner:{data?:{countryCode?: string, name?: string}, id?: string} | undefined
  setSearching: React.Dispatch<React.SetStateAction<boolean>>,
  searching: boolean
  loading: boolean
  iceConnectionState: IceConnectionStateType
}
//Create the WebRTC Context with the data type specified
//and a empty object
const WebRTCContext = createContext<WebRTCContextData>({} as WebRTCContextData);
const RTC_PEER = () =>{
  return new RTCPeerConnection({
    // iceTransportPolicy:'relay',
    iceServers: [
      
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun2.l.google.com:19302'
        ], 
      },
      {
        username: "mcfuXh4icW5Q6Uf-dbFcyXbDhSi1YW2DhQkMDFskvw1LB7Kxh0G7y9nHes2bQdaLAAAAAGLSoTBtYWxpZQ==",
        credential: "9bfe26ec-04fa-11ed-8d53-0242ac120004",
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
        username: "6im40d7F6NYqlXEWP1tkuG-D3pQsbwgaxnUZu9UAlhRWY3mWcE29mNwwWdSqrosaAAAAAGLKlYhnaGF5NmE=",
        credential: "f56f17f2-002e-11ed-bb4d-0242ac120004",
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
        username: "FfKfp2HESRuWUh4BVBMNtnAH0S5uv1SrEOwtuMMuDgJVp6F16e4cp1nuUKmf0YpqAAAAAGLJTp5naHlhNg==",
        credential: "1a6ec2d2-ff6c-11ec-b1d2-0242ac140004",
        urls: [
            "turn:eu-turn1.xirsys.com:80?transport=udp",
            "turn:eu-turn1.xirsys.com:3478?transport=udp",
            "turn:eu-turn1.xirsys.com:80?transport=tcp",
            "turn:eu-turn1.xirsys.com:3478?transport=tcp",
            "turns:eu-turn1.xirsys.com:443?transport=tcp",
            "turns:eu-turn1.xirsys.com:5349?transport=tcp"
        ]
      },
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
      username: "pPo-6s0t6lZIca5mmoBXnlIWdbg6cmfERfz-nO-7DzjQkgr6gJTf9a0nuOGzKaBxAAAAAGLJpwZnaGFl",
      credential: "cc52c6fe-ffa0-11ec-a4bf-0242ac140004",
      urls: [
          "turn:eu-turn2.xirsys.com:80?transport=udp",
          "turn:eu-turn2.xirsys.com:3478?transport=udp",
          "turn:eu-turn2.xirsys.com:80?transport=tcp",
          "turn:eu-turn2.xirsys.com:3478?transport=tcp",
          "turns:eu-turn2.xirsys.com:443?transport=tcp",
          "turns:eu-turn2.xirsys.com:5349?transport=tcp"
      ]
      },
    ],
  })
}
const WebRTCProvider: React.FC = ({children}) => {
  const [loading, setLoading] = useState(true)
  const [initializer, setInitializer] = useState(false)
  const [reconnectionTimes, setReconnectionTimes] = useState(0)
  const [partner, setPartner] = useState<{data?:{countryCode?: string, name?: string}, id?: string}>()
  const [myconn, setMyconn] = useState<RTCPeerConnection>(RTC_PEER())
  const [searching, setSearching] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream>()
  const [remoteStream, setRemoteStream] = useState<MediaStream>()
  const [mediaOptions, setMediaOptions] = useState({ audio: true, video: false })
  const [iceConnectionState, setIceConnectionState] = useState<IceConnectionStateType>('new')
  const reconnected = (times:number) =>{
    setReconnectionTimes(times)
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
  useEffect(()=>{
    myconn.oniceconnectionstatechange = ()=> {
      setIceConnectionState((myconn as any)?.iceConnectionState ?? 'new')
    }
  }, [myconn])
  const reset = () => {
    setReconnectionTimes(0)
    myconn.close()
    setLocalStream(undefined)
    setRemoteStream(undefined)
    setSearching(false)
    setPartner(undefined)
    setMyconn(RTC_PEER())
    // return RTC_PEER()
    // socketEvent.emit('call-reset')
  }
  const restartNewConnection = ()=>{
    setReconnectionTimes(0)
    myconn.close()
    setSearching(false)
    setMyconn(RTC_PEER())
  }
  const startMedia = async () => {
    let camera = await AsyncStorage.getItem('camera')
    const media = await mediaDevices.getUserMedia({...mediaOptions, video: camera == 'ON'})
    setLocalStream(media);
    myconn.addStream(media)
    return media;
  }
  // useEffect(()=>{
  //   if(iceConnectionState == 'connected' || iceConnectionState == 'completed')return;
  //   startMedia()
  // }, [myconn, iceConnectionState])
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
    <WebRTCContext.Provider value={{setLoading, loading, restartNewConnection, iceConnectionState, setSearching, searching,mediaOptions, videoToggle, reconnected, reconnectionTimes, initializer, setInitializer, myconn, handleAnswer, createOffer, startMedia, stopMedia, reset, partnerConnect, partnerDisconnect, addIceCandidate, setLocalDescription , localStream, remoteStream, partner}}>
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