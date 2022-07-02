import React, {createContext, useState, useContext, useEffect, useRef,} from 'react';
import InCallManager from 'react-native-incall-manager';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
  RTCSessionDescriptionType,
} from 'react-native-webrtc';
import { useAuth } from './Auth';
type WebRTCContextData = {
  myconn: RTCPeerConnection,
  createOffer: ()=>Promise<RTCSessionDescriptionType>,
  handleAnswer: (answer:RTCSessionDescriptionType)=>void,
  localStream: MediaStream | undefined,
  remoteStream: MediaStream | undefined,
  partner:[{session?:{countryCode?: string, name?: string}, id?: string}, React.Dispatch<React.SetStateAction<{}>>]
  useVideo: boolean,
  setUseVideo: React.Dispatch<React.SetStateAction<boolean>>,
  hangUp:()=>void;
};
//Create the WebRTC Context with the data type specified
//and a empty object
const WebRTCContext = createContext<WebRTCContextData>({} as WebRTCContextData);
const rtcPeer = () =>{
  return new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun2.l.google.com:19302'
        ],  
      },
      {
        urls:["turn:ghethoturn.fly.dev"],
        credential:"mysecret",
        username: 'coturn'
      }
    ],
  })
}
const WebRTCProvider: React.FC = ({children}) => {
  const partner = useState<{session?:{countryCode?: string, name?: string}, id?: string}>({})
  const {session} = useAuth()
  const [useVideo, setUseVideo] = useState(true)
  const [myconn, setMyconn] = useState<RTCPeerConnection>(rtcPeer());
  useEffect(()=>{
    setMyconn(rtcPeer())
  }, [])
  const [localStream, setLocalStream] = useState<MediaStream>()
  const [remoteStream, setRemoteStream] = useState<MediaStream>()
  useEffect(()=>{
    myconn.onaddstream = (event:any) => {
      setRemoteStream(event.stream);
    };
  }, [myconn])
  useEffect(()=>{
    mediaDevices
      .getUserMedia({
        audio: true,
        video: true
      })
      .then((stream) => {
        // Got stream!
        setLocalStream(stream);

        // setup stream listening
        myconn.addStream(stream);
      })
      .catch((error) => {
        // Log error
      });
  }, [useVideo, myconn])
  const createOffer = ():Promise<RTCSessionDescriptionType> => {
    return new Promise<RTCSessionDescriptionType>((resolve)=>{
      myconn.createOffer({}).then((offer) => {
        myconn.setLocalDescription(offer as RTCSessionDescription).then(() => {
          return resolve(offer)
        });
      });
    })
  }
  const handleAnswer = (answer:RTCSessionDescriptionType) => {
    myconn.setRemoteDescription(new RTCSessionDescription(answer));
  };
  useEffect(()=>{
    myconn.onconnectionstatechange = (e)=>{
      if(myconn.connectionState == 'failed'){
        hangUp()
      }
      console.log(myconn.connectionState, session?.name)
    }
    myconn.onsignalingstatechange = ()=>{
      console.log(myconn.signalingState,'signal', session?.name)
    }
  }, [myconn])
  useEffect(()=>{
    if(remoteStream?.toURL()){
    // InCallManager.start({media: 'audio'});
      InCallManager.setForceSpeakerphoneOn(true);
      InCallManager.setSpeakerphoneOn(true);
    }
  }, [remoteStream])
  const hangUp = () => {
    partner[1]({})
    setRemoteStream(undefined);
    myconn.close();
    setMyconn(rtcPeer())
  }
  return (
    //This component will be used to encapsulate the whole App,
    //so all components will have access to the Context
    <WebRTCContext.Provider value={{myconn, localStream, remoteStream, createOffer, handleAnswer, partner, setUseVideo, useVideo, hangUp}}>
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