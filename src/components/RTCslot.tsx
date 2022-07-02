import { StyleSheet, Text, View, Dimensions } from 'react-native'
import React, { useEffect } from 'react'
import { RTCView } from 'react-native-webrtc'
import { Loading } from './Loading'
import { Colors } from 'react-native/Libraries/NewAppScreen'
// import { usePeer } from '../context/Peer'

const RTCslot = () => {
  // const {loading, mediaStream, remoteStream} = usePeer()
  
  return (
    <View style={{ flex:1, height: Dimensions.get('screen').height }}>
      {/* {(loading) && 
        <Loading />
      }
      
      {remoteStream &&
        (
          <RTCView mirror style={styles.remoteStream} zOrder={1} streamURL={remoteStream.toURL()}/>
        )
      }
      {mediaStream &&
        <RTCView mirror style={styles.stream} zOrder={20} streamURL={mediaStream.toURL()}/>
      } */}
    </View>
  )
}

export default RTCslot
const styles = StyleSheet.create({
  stream: {
    width: Dimensions.get('screen').width,
    position: 'absolute',
    height: Dimensions.get('screen').height / 4,
    bottom: 0,
    right: 0
  },
  remoteStream: {
    flex:1,
  },
  footer: {
    backgroundColor: Colors.lighter,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
});