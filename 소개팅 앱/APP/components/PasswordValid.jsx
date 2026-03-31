import { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import { patternNum, patternEng } from '@/libs/utils';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';

export default function Component({
    pw,
    repw,
    setValid=()=>{}
}) {

    const [ colorValid, setColorValid ] = useState({});


    useEffect(() => {

        const ob = {
            color1: patternEng.test(pw),
            color2: patternNum.test(pw),
            color3: (pw?.length > 7 && pw?.length < 21),
            color4: (pw?.length > 7 && repw?.length > 7 && pw === repw)
        }

        setColorValid(ob);

        setValid((
            !ob.color1 || 
            !ob.color2 || 
            !ob.color3 || 
            !ob.color4
        ));

    }, [pw, repw])


    return (
        <View style={{ gap: 4 }}>
            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 5 }]}>
                <Image source={images?.[colorValid?.color1 ? `pw_on` : `pw_off`]} style={styles.image} />
                <Text style={[styles.title, colorValid?.color1 && { color: colors.main, fontFamily: fonts.semiBold } ]}>영문 포함</Text>
            </View>

            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 5 }]}>
                <Image source={images?.[colorValid?.color2 ? `pw_on` : `pw_off`]} style={styles.image} />
                <Text style={[styles.title, colorValid?.color2 && { color: colors.main, fontFamily: fonts.semiBold } ]}>숫자 포함</Text>
            </View>

            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 5 }]}>
                <Image source={images?.[colorValid?.color3 ? `pw_on` : `pw_off`]} style={styles.image} />
                <Text style={[styles.title, colorValid?.color3 && { color: colors.main, fontFamily: fonts.semiBold } ]}>8~20자</Text>
            </View>

            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 5 }]}>
                <Image source={images?.[colorValid?.color4 ? `pw_on` : `pw_off`]} style={styles.image} />
                <Text style={[styles.title, colorValid?.color4 && { color: colors.main, fontFamily: fonts.semiBold } ]}>비밀번호 일치</Text>
            </View>
            
        </View>
    );
}

const styles = StyleSheet.create({
    root: {

    },
    image: {
        width: 17.6,
        height: 17
    },
    title: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.regular,
        color: colors.grey9
    }
});
