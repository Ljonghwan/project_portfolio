import { PropsWithChildren, ReactElement } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';

import { numFormat, elapsedTime } from '@/libs/utils';

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

export default function Component({
    index=0,
    item=null,
    my=false,
    viewables
}) {

    const { styles } = useStyle();

    // const animatedStyle = useAnimatedStyle(() => {

    //     const isVisible = viewables.value.includes(item.idx);

    //     return {
    //         // transform: [
    //         //     { scale: withTiming(isVisible ? 1 : 0.7, { duration: 100 } )}
    //         // ],
    //         opacity: withTiming(isVisible ? 1 : 0, { duration: 100 })
    //     }
    // }, [item.idx, viewables])

    return (
        <AnimatedTouchable 
            entering={FadeIn}
            style={[styles.root, my && { borderWidth: 1, borderColor: colors.main, backgroundColor: colors.main4 } ]} 
            onPress={() => {
                router.navigate({
                    pathname: routes.rankDetail,
                    params: {
                        data: JSON.stringify(item),
                        rank: index
                    }
                })
            }}
        >
            <View style={styles.item} >
                <View style={[ rootStyle.flex, { gap: 10, justifyContent: 'flex-start', flex: 1 }]}>
                    <Text style={styles.count}>{numFormat(index)}</Text>

                    <Image source={item?.profile ? consts.s3Url + item?.profile : images.profile} style={styles.itemImage}/>

                    <View style={styles.container}>
                        <Text style={styles.listItemName} numberOfLines={1}>{item?.nickName}</Text>
                        <View style={[rootStyle.flex, { gap: 9, justifyContent: 'flex-start' }]}>
                            <View style={[rootStyle.flex, { gap: 5 }]}>
                                <Image source={images.flirting} style={[ rootStyle.flirting, { width: 12 } ]} />
                                <Text style={styles.listText}>플러팅 자산</Text>
                            </View>
                            <Text style={[styles.listText, { fontFamily: fonts.semiBold }]}>{numFormat(item?.cnt)}개</Text>
                        </View>
                    </View>
                </View>

                <Image source={images?.[`class_${item?.class}`] || images?.class_c} style={styles.rank} />
                
            </View>
        </AnimatedTouchable>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    const styles = StyleSheet.create({
        root: {
            paddingHorizontal: 12,
            paddingVertical: 16,
            marginBottom: 15,
            borderRadius: 8,
            
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
        item: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            
        },
        itemImage: {
            width: 46,
            aspectRatio: 1/1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        container: {
            flex: 1,
            gap: 4,
        },
        rank: {
            width: 63,
            ...rootStyle.rankBadge
        },
        count: {
            fontSize: 18,
            fontFamily: fonts.medium,
            color: colors.black
        },
        listItemName: {
            fontSize: 18,
            fontFamily: fonts.medium,
            color: colors.black,
            flex: 1
        },
        listText: {
            fontSize: 16,
            color: colors.black,
            letterSpacing: -0.4
        }
    });

    return { styles }
}
