import { View, StyleSheet } from 'react-native';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

export default function Component({
    style,
    textStyle,
    type=1,
    labels=[]
}) {

    return (
        <View style={[styles?.['type_' + type], style]}>
            {labels?.map((x, i) => {
                return (
                    <Text 
                        key={i} 
                        style={[
                            styles[`type_${type}_text`], 
                            [1, 2, 3].includes(type) && i === labels?.length -1 && { flexShrink: 1, flex: 0.5 },
                            textStyle
                        ]}
                        numberOfLines={1}
                    >{x}</Text>
                )
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    type_1: {
        flexDirection: 'row',
        alignItems: "center",
        backgroundColor: colors.efeff5,
        height: 32
    },
    type_1_text: {
        flex: 0.25,
        color: colors.text686B70,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 12,
    },
    type_2: {
        flexDirection: 'row',
        alignItems: "center",
        backgroundColor: colors.white,
        height: 46
    },
    type_2_text: {
        flex: 0.25,
        color: colors.text757575,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 14,
    },
    type_3: {
        flexDirection: 'row',
        alignItems: "center",
        backgroundColor: colors.white,
        height: 56
    },
    type_3_text: {
        flex: 0.25,
        color: colors.text757575,
        textAlign: "center",
        fontFamily: fonts.semiBold,
        fontSize: 14,
    },
});
