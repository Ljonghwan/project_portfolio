import { View, StyleSheet, TouchableOpacity, useWindowDimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import dayjs from 'dayjs';
import { router } from "expo-router";
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import Text from '@/components/Text';

import Manager from '@/components/badges/Manager';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';

import { numFormat } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Component({
    style,
    item=null,
    index,
    viewables,
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
        <AnimatedTouchable style={[styles.item, animatedStyle]} activeOpacity={1} onPress={() => { 
            router.navigate({
                pathname: routes.feedDetail,
                params: {
                    idx: item?.idx
                }
            });
        }}>
            <View>
                <Image source={consts.s3Url + item?.photoList?.[0]} style={styles.itemImage}/>
                <Manager style={{ position: 'absolute', left: 4, top: 7.5 }} type={2} level={item?.creator?.type} />
            </View>

            <View style={styles.container}>

                <View style={{ gap: 4 }}>
                    <Text style={[styles.listItemTitle, { color: consts.manager?.[`manager${item?.creator?.type}`]?.bg }]} numberOfLines={1}>{item?.creator?.nickName || '매니저'}</Text>
                    <Text style={[styles.listItemTitle, { height: 40 }]} numberOfLines={2}>{item?.title}</Text>
                </View>

                <View style={{ gap: 4 }}>
                    <Text style={styles.listItemDate}>{dayjs(item?.createAt).format('YYYY-MM-DD')}</Text>
                    <View style={[rootStyle.flex, { alignSelf: 'flex-end', justifyContent: 'flex-start', gap: 8 }]}>
                        {/* <View style={[rootStyle.flex, { gap: 3 }]}>
                            <Image source={images.view_gray} style={rootStyle.default20} />
                            <Text style={styles.count}>{numFormat(item?.view + 1232213)}</Text>
                        </View> */}
                        <View style={[rootStyle.flex, { gap: 3 }]}>
                            <Image source={images.heart_off} style={rootStyle.default20} />
                            <Text style={styles.count}>{numFormat(item?.likeCount)}</Text>
                        </View>
                        <View style={[rootStyle.flex, { gap: 3 }]}>
                            <Image source={images.chat} style={rootStyle.default20} />
                            <Text style={styles.count}>{numFormat(item?.commentCount)}</Text>
                        </View>
                    </View>
                </View>
              
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
            flex: 1,
            justifyContent: 'space-between'
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
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.35
        },
        listItemContent: {
            fontSize: 12,
            color: colors.grey76,
            letterSpacing: -0.48
        },
        listItemDate: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.grey9,
            letterSpacing: -0.3
        },
        count: {
            fontSize: 12,
            color: colors.grey6,
            letterSpacing: -0.3
        }
    });

    return { styles }
}


