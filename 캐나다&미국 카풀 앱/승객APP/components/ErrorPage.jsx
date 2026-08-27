import React from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View
} from 'react-native';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

export default function Component({
    style, 
    msg="내용이 없습니다.",
    fixed
}) {

    const { styles } = useStyle();

    return (
        <View style={[styles.root]}>
            <Image source={images.logo} style={rootStyle.logo} />
            <Text style={styles.title} >{`오류가 발생했습니다.\n잠시후 다시 시도해주세요.`}</Text>
            <Button onPress={() => { }}>NO!!!!!!</Button>
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        title: {
            
        }
    })
  
    return { styles }
}
