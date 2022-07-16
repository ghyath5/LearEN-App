import { useRef } from 'react';
import { View,Text } from 'react-native';
import Carousel from 'react-native-snap-carousel';

export const MyCarousel = () => {
    const myCarousel = useRef()
    const renderText = ({item}:{item:any}) => {
        return (
            <View style={{}}>
                <Text>{ item.title }</Text>
            </View>
        );
    }
    return (
        <Carousel
            windowSize={1}
          ref={myCarousel.current}
          data={[]}
          renderItem={renderText}
        />
    );
}