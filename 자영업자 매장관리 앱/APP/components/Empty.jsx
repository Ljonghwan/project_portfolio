import React from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View
} from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    image=null
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
            <Text style={styles.text}>{msg || '내용이 없습니다.'}</Text>
        </View>
           
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            width: '100%',
            height: '100%',
            gap: 20,
            paddingBottom: rootStyle?.header?.height + insets?.top
        },
        text: {
            color: colors.textSecondary,
            fontSize: 14,
        },
    })
  
    return { styles }
}
