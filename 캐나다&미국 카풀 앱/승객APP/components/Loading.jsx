import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    useWindowDimensions
} from 'react-native';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';

export default function Loading({
    style, 
    color=colors.white,
    fixed,
    entering=true,
    exiting=true,
    size="small"
}) {

    const { styles } = useStyle();

    return (
        <Animated.View
            entering={entering ? FadeIn.duration(200) : null}
            exiting={exiting ? FadeOut.duration(200) : null}
            style={[
                styles.container, 
                fixed && { position: 'absolute', top: 0, left: 0, zIndex: 10000, paddingBottom: rootStyle?.header?.height },
                style,
            ]}
        >
            <ActivityIndicator size={size} color={color} />
        </Animated.View>
           
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: 'row',
            alignItems: "center",
            justifyContent: "center",
            width: '100%',
            height: '100%',
        },
        spiner: {
            
        },
    })
  
    return { styles }
}
