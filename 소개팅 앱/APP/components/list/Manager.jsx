import { PropsWithChildren, ReactElement } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Image } from 'expo-image';
import { router } from "expo-router";

import Text from '@/components/Text';

import Manager from '@/components/badges/Manager';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';

import { numFormat, elapsedTime } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Component({
    type=1,
    style,
    item=null,
    viewables
}) {

    const { styles } = useStyle();

    const animatedStyle = useAnimatedStyle(() => {

        const isVisible = viewables.value.includes(item.idx);

        return {
            transform: [
                { scale: withTiming(isVisible ? 1 : 0.7, { duration: 100 } )}
            ],
            opacity: withTiming(isVisible ? 1 : 0, { duration: 100 })
        }
    }, [item.idx, viewables])

    return (
        <AnimatedTouchable style={[styles.item, animatedStyle]} onPress={() => {
            router.navigate({
                pathname: routes.managerDetail,
                params: {
                    idx: item?.idx,
                    title: consts.manager?.[`manager${item?.type}`]?.title
                }
            });
        }}>
            <View>
                <Image source={item?.profile ? consts.s3Url + item?.profile : null} style={styles.itemImage}/>
                <Manager style={{ position: 'absolute', left: 4, top: 7.5 }} type={2} level={item?.type} />
            </View>

            <View style={styles.container}>

                <Text style={[styles.listItemTitle, { color: consts.manager?.[`manager${item?.type}`]?.bg }]} numberOfLines={1}>{item?.nickName}</Text>
                <Text style={[styles.listItemContent, { height: 40 } ]} numberOfLines={2}>{item?.memo}</Text>
              
            </View>
        </AnimatedTouchable>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
        
    const styles = StyleSheet.create({
        item: {
            width: ( width - 40 - 10 ) / 2,
            borderRadius: 12,
            marginBottom: 20,
            
            backgroundColor: colors.white,
            shadowColor: colors.shadow,
            shadowOffset: {
                width: 1,
                height: 1,
            },
            shadowOpacity: 0.3,
            shadowRadius: 5,

            elevation: 20,
        },
        itemImage: {
            width: '100%',
            aspectRatio: 1/1,
            borderRadius: 12,
            backgroundColor: colors.placeholder
        },
        container: {
            padding: 8,
            gap: 4,
            flex: 1
        },
        listItemName: {
            flexShrink: 1, 
            fontSize: 14,
            color: colors.dark,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.56
        },
        listItemTitle: {
            fontSize: 14,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.35
        },
        listItemContent: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.35
        },
        listItemDate: {
            fontSize: 14,
            color: colors.greyD,
            letterSpacing: -0.35
        },
        count: {
            fontSize: 10,
            color: colors.dark,
            letterSpacing: -0.25
        }
    });

    return { styles }
}


