import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";
import Animated, { FadeIn } from 'react-native-reanimated';
import dayjs from 'dayjs';

import Text from '@/components/Text';

import Simple from '@/components/badges/Simple';
import Manager from '@/components/badges/Manager';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { useConfig } from '@/libs/store';

import { numFormat, elapsedTime } from '@/libs/utils';

export default function Component({
    style,
    item=null
}) {

    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const isKeepOn = ( item?.type === 2 && item?.status === 1 && item?.userAccept === 2 && item?.visualAccept === 2 && !item?.endTimestamp );

    return (
        <TouchableOpacity style={styles.item} activeOpacity={1} onPress={() => { 
            router.navigate({
                pathname: routes.chatRoom,
                params: {
                    idx: item?.idx,
                }
            })
        }}>
            {item?.badgeCount > 0 && (
                <View style={styles.count}>
                    <Text style={styles.countText}>{numFormat(item?.badgeCount, 99)}</Text>
                </View>
            )}
            
            <View style={styles.profileBox}>

                <Image source={item?.type === 2 ? images?.[`chat_progress_${item?.dayCount > 4 ? 4 : (item?.dayCount || 1)}`] : images.chat_progress_0} style={[styles.itemImageProgress, { width: styles.itemImage.width + 5 }]}/>
                
                <Image source={item?.user?.profile ? consts.s3Url + item?.user?.profile : images.profile} style={styles.itemImage}/>
            </View>

            <View style={[rootStyle.flex, { gap: 5 }]}>
                <Text style={styles.itemName}>{item?.user?.name}</Text>
                {item?.type === 3 ? (
                    <Manager type={3} level={item?.user?.type} /> 
                ) : (
                    <View style={[styles.badge, { borderColor: item?.type === 2 ? colors?.chatType2?.[item?.dayCount > 4 ? 4 : (item?.dayCount || 1)] : colors?.[`chatType${item?.type}`] }]}>
                        <Text style={[styles.badgeText, { color: item?.type === 2 ? colors?.chatType2?.[item?.dayCount > 4 ? 4 : (item?.dayCount || 1)] : colors?.[`chatType${item?.type}`] }]}>
                            {
                                item?.type === 1 ? `프리뷰챗` 
                                : item?.type === 2 ? (
                                    (isKeepOn || item?.status === 2) ? '결정완료' : `${item?.rematch ? '리매치 ' : ''}${item?.dayCount > 4 ? 4 : item?.dayCount}일차`
                                ) : `리매치`
                            }
                        </Text>
                    </View>
                )}
            </View>

            {item?.type === 3 ? (
                <View style={[rootStyle.flex, { gap: 4 }]}>
                    {/* <Manager type={2} level={item?.user?.type} /> */}
                </View>
            ) : (
                <View style={[rootStyle.flex, { gap: 4 }]}>
                    {typeof(item?.user?.height) === 'number' && <Simple title={configOptions?.heightOptions?.[item?.user?.height]}/>}
                    <Simple title={dayjs(item?.user?.birth).format('YY')}/>
                </View>
            )}
           

            <Text style={styles.message} numberOfLines={1}>{item?.lastMessage || "메시지 없음"}</Text>
        
        </TouchableOpacity>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
        
    const styles = StyleSheet.create({
        item: {
            flex: 1,
            maxWidth: (width - 50 - 20) / 2,
            borderRadius: 20,
            paddingHorizontal: 15,
            paddingTop: 8,
            paddingBottom: 21,

            gap: 11,
            
            backgroundColor: colors.white,
            shadowColor: colors.shadow2,
            shadowOffset: {
                width: 0,
                height: 0,
            },
            shadowOpacity: 0.25,
            shadowRadius: 5,

            elevation: 10,
        },
        profileBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
        },
        itemImage: {
            width: 48,
            aspectRatio: 1/1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        itemImageProgress: {
            position: 'absolute',
            aspectRatio: 1/1,
        },
        itemName: {
            fontSize: 16,
            lineHeight: 20,
            color: colors.black,
            letterSpacing: -0.4
        },
        badge: {
            paddingHorizontal: 8,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: colors.chatType1
        },
        badgeText: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.chatType1,
            letterSpacing: -0.3
        },
        message: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.grey3,
            letterSpacing: -0.3,
            textAlign: 'center'
        },
        count: {
            width: 24,
            aspectRatio: 1/1,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1000,
            backgroundColor: colors.red,
            position: 'absolute',
            top: 8,
            right: 8
        },
        countText: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.white,
            letterSpacing: -0.3,
            textAlign: 'center'
        }




    });

    return { styles }
}


