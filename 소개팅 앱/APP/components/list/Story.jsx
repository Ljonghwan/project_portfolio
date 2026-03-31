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
                pathname: routes.storyDetail,
                params: {
                    idx: item?.idx
                }
            });
        }}>
            <View>
                <Image source={consts.s3Url + item?.photo} style={styles.itemImage}/>
            </View>

            <View style={styles.container}>

                <Text style={styles.listItemTitle} numberOfLines={1}>{item?.title}</Text>
                <Text style={styles.listItemDate}>{elapsedTime(item?.createAt)}</Text>
              
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
            padding: 12,
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
            fontSize: 16,
            lineHeight: 24,
            color: colors.dark,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.4
        },
        listItemContent: {
            fontSize: 12,
            color: colors.grey76,
            letterSpacing: -0.48
        },
        listItemDate: {
            fontSize: 14,
            color: colors.grey9,
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

