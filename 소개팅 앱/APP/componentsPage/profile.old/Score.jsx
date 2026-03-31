import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInLeft} from 'react-native-reanimated';
import { Slider } from 'react-native-awesome-slider';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ListItem from '@/components/ListItem';

import { useConfig } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import dummy from '@/libs/dummy';
import rootStyle from '@/libs/rootStyle';

const boxWidth = 150; // 가로
const boxHeight = 440; // 세로

function Item({ active, title }) {

    const { styles } = useStyle();
    const textColor = useSharedValue(false);

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(textColor.value ? colors.dark : colors.grey6, { duration: 150 }),
            fontSize: withTiming(textColor.value ? 20 : 16, { duration: 150 }),
        };
    });

    useEffect(() => {
        textColor.value = active; 
    }, [active])

    return (
        <View 
        >
            <Animated.Text style={[styles.listText, animatedTextStyle, { fontSize: title?.length > 6 ? 14 : 16 }]} numberOfLines={1}>{title}</Animated.Text>
        </View>
    );
}


export default function Component({
    name,
    value,
    setValue=()=>{},
    target
}) {

    const { styles } = useStyle();

    const { configOptions } = useConfig();

    const progress = useSharedValue(value);
    const min = useSharedValue(0);
    const max = useSharedValue(configOptions?.scoreOptions?.length - 1);
    

    useEffect(() => {


    }, [])

    
    return (
        <View style={styles.root}>

            <Animated.View entering={FadeInLeft}>
                <Text style={styles.title}>{target ? '원하는 이성의 외모 점수는\n어느 정도인가요?' : '회원님의 외모 점수는 어느 정도인가요?'}</Text>
            </Animated.View>

            <Animated.View entering={FadeIn} style={{ gap: 40 }}>

                <View style={styles.sliderBox}>
                    <Slider
                        hapticMode={'step'}
                        style={styles.slider}
                        containerStyle={{ borderRadius: 8 }}
                        progress={progress}
                        minimumValue={min}
                        maximumValue={max}
                        steps={(configOptions?.scoreOptions?.length - 1)}
                        forceSnapToStep={true}
                        onValueChange={v => setValue({ value: v, name: name })}
                        onHapticFeedback={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);	
                        }}
                        panHitSlop={100}
                        thumbWidth={30}
                        sliderHeight={7}
                        theme={{
                            maximumTrackTintColor: colors.greyD9,
                            minimumTrackTintColor: colors.main3,
                        }}
                        renderThumb={() => (
                            <View style={styles.thumb} />
                        )}
                        renderBubble={() => (null)}
                        renderMark={() => (null)}
                    />

                </View>

                <View style={{  flexDirection: 'row', justifyContent: 'space-around' }}>
                    {configOptions?.scoreOptions?.map((x, i) => {
                        return (
                            <Item key={i} title={`${x}점`} active={i === value}/>
                        )
                    })}
                </View>
            </Animated.View>
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    const styles = StyleSheet.create({
        root: {
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 20,
            gap: 40,
        },
        title: {
            color: colors.dark,
            fontSize: 24,
            lineHeight: 28,
            fontFamily: fonts.bold,
            letterSpacing: -1.2,
            textAlign: 'center'
        },
        listText: {
            color: colors.grey6,
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4,
            fontFamily: fonts.semiBold,
            textAlign: 'center'
        },


        thumb: {
            width: 30,
            height: 30,
            borderRadius: 1000,
            backgroundColor: colors.main
        },
        sliderBox: {
            justifyContent: 'center',
            alignItems: 'center'
        },
        slider: {
            width: width - 60
        }
    });

  
    return { styles }
}
