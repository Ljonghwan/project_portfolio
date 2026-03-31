import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList, useWindowDimensions, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInLeft } from 'react-native-reanimated';
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

function Item({ active, title  }) {

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
        <View>
            <Animated.Text style={[styles.listText, animatedTextStyle, { fontSize: title?.length > 6 ? 14 : 16 }]} numberOfLines={1} >{title}</Animated.Text>
        </View>
    );
}

export default function Component({
    name,
    value,
    setValue = () => { },
    target
}) {

    const { configOptions } = useConfig();
    const [test, setTest] = useState(0);

    const progress = useSharedValue(value);
    const min = useSharedValue(0);
    const max = useSharedValue(configOptions?.heightOptions?.length - 1);
    
    useEffect(() => {


    }, [])

    return (
        <ScrollView style={styles.root} contentContainerStyle={{ 
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 20,
            gap: 40,
        }}>
            <Animated.View entering={FadeInLeft}>
                <Text style={styles.title}>{target ? '원하는 이성의' : '회원님의'} 키를 입력해 볼까요?</Text>
            </Animated.View>
            <Animated.View entering={FadeIn} style={[{ flexDirection: 'row', alignSelf: 'center', justifyContent: 'center', width: boxWidth, height: boxHeight }]}>

                <View style={styles.sliderBox}>
                    <Slider
                        hapticMode={'step'}
                        style={styles.slider}
                        containerStyle={{ borderRadius: 8 }}
                        progress={progress}
                        minimumValue={min}
                        maximumValue={max}
                        panHitSlop={200}
                        steps={(configOptions?.heightOptions?.length - 1)}
                        forceSnapToStep={true}
                        onValueChange={v => setValue({ value: v, name: name })}
                        onHapticFeedback={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);	
                        }}
                        thumbWidth={30}
                        sliderHeight={7}
                        theme={{
                            maximumTrackTintColor: colors.main3,
                            minimumTrackTintColor: colors.greyD9,
                        }}
                        renderThumb={() => (
                            <View style={styles.thumb} />
                        )}
                        renderBubble={() => (null)}
                        renderMark={() => (null)}
                    />

                </View>

                <View style={{  flexDirection: 'column',justifyContent: 'space-between', width: boxWidth, heigth: '100%', left: (boxWidth / 3) }}>
                    {configOptions?.heightOptions?.map((x, i) => {
                        return (
                            <Item key={i} title={x} active={i === value} />
                        )
                    })}
                </View>
                {/*                 
                <FlatList
                    indicatorStyle={'black'}
                    data={configOptions?.heightOptions}
                    renderItem={renderItem}
                    numColumns={2}
                    style={styles.scroll} 
                    columnWrapperStyle={{ gap: 4 }}
                    contentContainerStyle={{ paddingBottom: 20, rowGap: 4 }}
                /> */}
                {/* 
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 20, gap: 4 }} showsVerticalScrollIndicator={false}>
                    {configOptions?.heightOptions?.map((x, i) => {
                        return (
                            <TouchableOpacity key={i} style={[styles.item, value === x && styles.itemActive]} onPress={() => setValue({ value: x, name: name })}>
                                <Text style={styles.itemText} numberOfLines={1}>{x}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView> */}

            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
       
    },
    title: {
        color: colors.dark,
        fontSize: 24,
        lineHeight: 28,
        fontFamily: fonts.bold,
        letterSpacing: -0.6,
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
        alignSelf: 'center',
        transform: [{ rotate: '90deg' }] ,
        position: 'absolute',
        left: -(boxHeight / 2)
    },
    slider: {
        width: boxHeight, // 회전되므로 이게 높이 역할
    }
});
