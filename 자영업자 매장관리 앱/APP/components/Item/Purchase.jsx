import React, { useState } from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
    Pressable,
    TouchableOpacity
} from 'react-native';

import { router, useFocusEffect } from "expo-router";
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeInRight, FadeOut, SlideInUp, SlideOutUp, FadeIn } from 'react-native-reanimated';
import dayjs from 'dayjs';

import Text from '@/components/Text';
import Empty from '@/components/Empty';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import { numFormat } from '@/libs/utils';


export default function Component({
    item,
    styleContext
}) {

    const { styles } = useStyle();

	const rotate = useSharedValue(0);

    const [view, setView] = useState(false);

    const onToggle = () => {
		setView(prev => {
			const next = !prev;
			rotate.value = withTiming(next ? 180 : 0, { duration: 300 });
			return next;
		});
	};

    const rotateStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotate.value}deg` }],
	}));

    return (
        <Pressable
            style={[styles.root]}
            onPress={onToggle}
        >
            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 12, paddingHorizontal: 12, }]}>
                <Animated.View style={[rotateStyle]} >
                    <Image source={images.down} style={rootStyle.default14} />
                </Animated.View>
                <View style={[{ paddingRight: 5, gap: 7 }]}>
                    {/* <Image source={images.down} style={rootStyle.default14} /> */}
                    <View style={[rootStyle.flex, { gap: 11, flex: 1, justifyContent: 'space-between' }]}>

                        <Text style={{ ...rootStyle.font(14, colors.black, fonts.semiBold), flexShrink: 1 }} numberOfLines={1}>{item?.[0]?.company}</Text>
                    </View>
                    <Text style={{ ...rootStyle.font(13, colors.black, fonts.semiBold) }}>
                        총합 : {numFormat(item?.reduce((acc, item) => acc + item?.total, 0) || 0)}원 | 최근 거래 : {dayjs(item?.[0]?.date + "").format('MM/DD')}
                    </Text>
                </View>
            </View>

            {view && (
                <Animated.View entering={FadeIn} style={{ gap: 22 }} >
                    {item?.map((x, i) => {
                        return (
                            <TouchableOpacity key={i} style={{ gap: 7, paddingHorizontal: 22 }} onPress={() => {
                                router.push({
                                    pathname: routes.매입등록,
                                    params: {
                                        idx: x?.idx
                                    }
                                })
                            }}>
        
                                <View style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10 }]}>
                                    <Text style={{ ...rootStyle.font(13, colors.text757575, fonts.semiBold) }}>{dayjs(x?.date + "").format('MM월 DD일')}</Text>
                                    <Text style={{ ...rootStyle.font(13, colors.text757575, fonts.semiBold) }}>{numFormat(x?.list?.reduce((acc, xx) => acc + (xx?.quantity * xx?.amount), 0) || 0)}원</Text>
                                </View>
                                
                                {x?.list?.map((xx, ii) => {
                                    return (
                                        <View key={`${i}_${ii}`} style={[rootStyle.flex, { justifyContent: 'space-between', gap: 10, paddingLeft: 5 }]}>
                                            <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 4 }]}>
                                                <Text style={{ ...rootStyle.font(12, colors.text757575), textAlign: 'left', }}>{xx?.title}</Text>
                                                <Text style={{ ...rootStyle.font(12, colors.text757575), textAlign: 'right' }}>{numFormat(xx?.quantity)} x {numFormat(xx?.amount)}</Text>
                                            </View>
                                            <Text style={{ ...rootStyle.font(12, colors.text757575), textAlign: 'right' }}>{numFormat(xx?.quantity * xx?.amount)}원</Text>
                                        </View>
                                    )
                                })}
                            
                            </TouchableOpacity>
                        )
                    })}
                </Animated.View>
            )}
            
        </Pressable>
    );
}





const useStyle = () => {

    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({

        root: {
            marginHorizontal: rootStyle.side,
            paddingVertical: 17,
            gap: 22,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12
        },
    })

    return { styles }
}
