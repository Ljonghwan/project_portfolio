import { PropsWithChildren, ReactElement } from 'react';
import {  View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

export default function Component({
    type=1,
    level=1,
    style
}) {

    const manager = consts.manager?.find(x => x?.value === level);
    if( !manager ) return null;

    return (
        <View style={[ style, { flexDirection: 'row' }]}>
            <View
                style={[
                    styles?.[`type_${type}`],
                    {
                        backgroundColor: manager?.bg,
                        borderColor: manager?.borderColor
                    }
                ]}
            >
                <Image source={manager?.mark} style={styles?.[`type_${type}_image`]} />
                <Text 
                    style={[
                        styles?.[`type_${type}_text`],
                        {
                            color: manager?.color
                        }
                    ]}
                >{manager?.title}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    type_1: {
        height: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        paddingHorizontal: 10,
        gap: 4,
        borderWidth: 0.5,
        borderColor: colors.grey6,
    },
    type_1_text: {
        fontSize: 10,
        fontFamily: fonts.bold,
        color: colors.white,
        letterSpacing: -0.25
    },
    type_1_image: {
        width: 14,
        height: 14,
    },
   
});
