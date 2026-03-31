import React from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View
} from 'react-native';


import Text from '@/components/Text';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';
import lang from '@/libs/lang';

import { useUser, useAlert } from '@/libs/store';


export default function Component({
    style,
    level=null
}) {

    const { styles } = useStyle();

    const { mbData } = useUser();

    return (
        level ? (
            <View
                style={[
                    styles.type_1, 
                    style,
                ]}
            >
                <Text style={styles.type_1_text}>{ lang({ id: level === 1 ? 'passenger' : 'driver'}) }</Text>
            </View>
        ) : (!mbData?.passenger || mbData?.level === 0) ? (
            <></>
        ) : (
            <View
                style={[
                    styles.type_1, 
                    style,
                ]}
            >
                <Text style={styles.type_1_text}>{ lang({ id: mbData?.level === 1 ? 'passenger' : 'driver'}) }</Text>
            </View>
        )
        
           
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        type_1: {
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 12,
            backgroundColor: colors.taseta,
            paddingVertical: 3,
            paddingHorizontal: 8
        },
        type_1_text: {
            color: colors.taseta_sub_2,
            textAlign: "center",
            fontFamily: fonts.medium,
            fontSize: 14,
        },
    })
  
    return { styles }
}
