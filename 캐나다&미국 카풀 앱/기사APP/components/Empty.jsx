import React from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View
} from 'react-native';

import { Image } from 'expo-image';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';

export default function Component({
    style, 
    msg=null,
    fixed,
    image='empty'
}) {

    const { styles } = useStyle();

    return (
        <View
            style={[
                styles.container, 
                style,
                fixed && { position: 'absolute', top: 0, left: 0, zIndex: 10000 }
            ]}
        >
            {image && <Image source={images?.[image]} style={{ width: 120, aspectRatio: 1 }}/>}
            <Text style={styles.text}>{msg || lang({ id: 'no_posts' })}</Text>
        </View>
           
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            width: '100%',
            height: '100%',
            gap: 20,
            paddingBottom: rootStyle?.header?.height
        },
        text: {
            color: colors.sub_1,
            fontSize: 20,
            fontFamily: fonts.semiBold
        },
    })
  
    return { styles }
}
