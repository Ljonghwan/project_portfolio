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

export default function Component({
    type='1',
    msg="",
    style,
    textStyle
}) {

    const { styles } = useStyle();

    return (
        <View
            style={[
                styles[`type_${type}`], 
                style,
            ]}
        >
            <Text style={[
                styles[`type_${type}_text`],
                textStyle
            ]}>{msg}</Text>
        </View>
           
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
        type_2: {
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 12,
            backgroundColor: colors.taseta_sub_2,
            paddingVertical: 3,
            paddingHorizontal: 8
        },
        type_2_text: {
            color: colors.taseta,
            textAlign: "center",
            fontFamily: fonts.medium,
            fontSize: 14,
        },
        type_3: {
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 12,
            backgroundColor: colors.text_popup,
            paddingVertical: 3,
            paddingHorizontal: 8
        },
        type_3_text: {
            color: colors.white,
            textAlign: "center",
            fontFamily: fonts.medium,
            fontSize: 14,
        },
        type_4: {
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 12,
            backgroundColor: colors.taseta_sub_2,
            paddingVertical: 2.5,
            paddingHorizontal: 8,
            borderWidth: 1,
            borderColor: colors.taseta
        },
        type_4_text: {
            color: colors.taseta,
            textAlign: "center",
            fontFamily: fonts.medium,
            fontSize: 14,
            lineHeight: 20
        },
    })
  
    return { styles }
}
