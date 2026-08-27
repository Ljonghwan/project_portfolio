import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';

import { patternEng, patternNum, patternSpc } from '@/libs/utils';

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Component({
    pw,
    repw,
    setValid=()=>{}
}) {

    const [ ob, setOb ] = useState({
        color1: false,
        color2: false,
        color3: false,
        color4: false,
        color5: false,
    });

    const color1 = useSharedValue(colors.sub_1);
    const color2 = useSharedValue(colors.sub_1);
    const color3 = useSharedValue(colors.sub_1);
    const color4 = useSharedValue(colors.sub_1);
    const color5 = useSharedValue(colors.sub_1);
    
    const animatedStyle1 = useAnimatedStyle(() => {
        return {
            color: withTiming(color1.value, { duration: 300 }),
        };
    });
    const animatedStyle2 = useAnimatedStyle(() => {
        return {
            color: withTiming(color2.value, { duration: 300 }),
        };
    });
    const animatedStyle3 = useAnimatedStyle(() => {
        return {
            color: withTiming(color3.value, { duration: 300 }),
        };
    });
    const animatedStyle4 = useAnimatedStyle(() => {
        return {
            color: withTiming(color4.value, { duration: 300 }),
        };
    });
    const animatedStyle5 = useAnimatedStyle(() => {
        return {
            color: withTiming(color5.value, { duration: 300 }),
        };
    });


    useEffect(() => {

        const obl = {
            color1: (pw?.length > 7 && pw?.length < 16),
            color2: patternEng.test(pw),
            color3: patternNum.test(pw),  
            color4: patternSpc.test(pw),
            color5: (pw?.length > 7 && repw?.length > 7 && pw === repw)
        }

        setOb(obl);

        color1.value = obl.color1 ? colors.taseta : colors.text_popup; 
        color2.value = obl.color2 ? colors.taseta : colors.text_popup; 
        color3.value = obl.color3 ? colors.taseta : colors.text_popup; 
        color4.value = obl.color4 ? colors.taseta : colors.text_popup; 
        color5.value = obl.color5 ? colors.taseta : colors.text_popup; 

        setValid((
            !obl.color1 || 
            !obl.color2 || 
            !obl.color3 || 
            !obl.color4 ||
            !obl.color5
        ));

    }, [pw, repw])


    return (
        <View style={{ gap: 4 }}>
            <View style={[ rootStyle.flex, { gap: 1, justifyContent: 'flex-start' }]}>
                <Image source={ob.color1 ? images.check_green : images.check_red} style={rootStyle.default} transition={100}/>
                <AnimatedText style={[styles.title, animatedStyle1 ]} >{lang({ id: '8_15_characters' })}</AnimatedText>
            </View> 

            <View style={[ rootStyle.flex, { gap: 1, justifyContent: 'flex-start' }]}>
                <Image source={ob.color2 ? images.check_green : images.check_red} style={rootStyle.default} transition={100}/>
                <AnimatedText style={[styles.title, animatedStyle2 ]} allowFontScaling={false}>{lang({ id: 'use_both_cases' })}</AnimatedText>
            </View> 

            <View style={[ rootStyle.flex, { gap: 1, justifyContent: 'flex-start' }]}>
                <Image source={ob.color3 ? images.check_green : images.check_red} style={rootStyle.default} transition={100}/>
                <AnimatedText style={[styles.title, animatedStyle3 ]} allowFontScaling={false}>{lang({ id: 'including_numbers' })}</AnimatedText>
            </View> 

            <View style={[ rootStyle.flex, { gap: 1, justifyContent: 'flex-start' }]}>
                <Image source={ob.color4 ? images.check_green : images.check_red} style={rootStyle.default} transition={100}/>
                <AnimatedText style={[styles.title, animatedStyle4 ]} allowFontScaling={false}>{lang({ id: 'include_special_char' })}</AnimatedText>
            </View> 

            <View style={[ rootStyle.flex, { gap: 1, justifyContent: 'flex-start' }]}>
                <Image source={ob.color5 ? images.check_green : images.check_red} style={rootStyle.default} transition={100}/>
                <AnimatedText style={[styles.title, animatedStyle5 ]} allowFontScaling={false}>{lang({ id: 'password_matching' })}</AnimatedText>
            </View> 
        </View>
    );
}

const styles = StyleSheet.create({
    root: {

    },
    title: {
        fontSize: 16,
        lineHeight: 19,
        fontFamily: fonts.medium,
        color: colors.sub_1,
        letterSpacing: -0.32
    }
});
