import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";
import Animated, { FadeInRight, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import dayjs from 'dayjs';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import images from '@/libs/images';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';

import API from '@/libs/api';

import { useUser, useAlert, useLoader } from '@/libs/store';

import { numFormat, ToastMessage } from '@/libs/utils';

export default function Component({
    item = null,
    dataFunc
}) {

    const { styles } = useStyle();

    const { mbData } = useUser();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const refundAlert = () => {

        openAlertFunc({
            icon: images.warning,
            label: `픽켓 ${numFormat(item?.count)}장을 환불 하시겠습니까?`,
            title: `* 픽켓은 사용하지 않을 시 7일 이내에\n환불 가능 합니다.`,
            onCencleText: "취소",
            onPressText: "환불하기",
            onPress: async () => {
                setTimeout( async () => {
                    openLoader();
    
                    let sender = {
                        idx: item?.idx   
                    }
                    const { data, error } = await API.post('/v1/assets/refundFlirting', sender);

                    setTimeout( async () => {
                        closeLoader();

                        if(error) {
                            ToastMessage(error?.message);
                        } else {
                            ToastMessage('환불이 완료되었습니다.');
                        }
                        
                        dataFunc();
                    }, consts.apiDelayLong)
                   
                    
                }, consts.apiDelayLong)

            }
        })

    }

    return (
        <View
            style={[styles.root, { paddingHorizontal: rootStyle.side }]}
        >
            <Image source={images.list_picket} style={rootStyle.default36} />

            <View style={styles.item} >
                <View style={[rootStyle.flex, { justifyContent: 'space-between'}]}>
                    <Text style={styles.itemName}>{`픽켓 ${numFormat(item?.count)}장`}</Text>
                    {/* <Text style={styles.itemCount}>+{numFormat(item?.amount)}원</Text> */}
                    {(item?.type === 1 || item?.type === 3) && consts.flirtingOptions?.find(x => x?.valueInclude?.includes(item?.status))?.type === 'minus' ? (
                        <Text style={[styles.itemCount, { color: colors.red }]}>{item?.status === 7 && "환불 "}-{numFormat(item?.amount)}원</Text>
                    ) : (
                        <Text style={styles.itemCount}>{numFormat(item?.amount)}원</Text>
                    )}
                </View>
                
                <View style={[rootStyle.flex, { justifyContent: 'space-between'}]}>
                    <Text style={styles.itemDate}>{dayjs(item?.createAt).format('HH:mm')}</Text>
                    <View style={[rootStyle.flex, { gap: 5 }]}>
                        <Text style={{...rootStyle.font(14, colors.text_info, fonts.regular)}}>{item?.chargeType === 4 ? item?.roomMessage : consts.chargeOptions?.find(x => x?.value === item?.chargeType)?.title}</Text>
                        {(mbData?.level === 1 && item?.type === 1 && item?.isRefund) && (
                            <TouchableOpacity style={[styles.badge]} onPress={refundAlert}>
                                <Text style={[styles.badgeText]}>환불하기</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>



                {/* <View style={{ gap: 4 }}>
                    <Text style={styles.itemDate}>{dayjs(item?.createAt).format('YYYY.MM.DD HH:mm')}</Text>

                    <Text style={styles.itemCount}>{item?.type === 1 ? `플러팅 ${numFormat(item?.count)}개` : item?.type === 2 ? '주선비용' : item?.type === 3 ? '리매치' : ''}</Text>
                </View>

                <View style={{ gap: 8 }}>
                    <View style={[rootStyle.flex, { gap: 4, justifyContent: 'flex-end' }]}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{consts.chargeOptions?.find(x => x?.value === item?.chargeType)?.title}</Text>
                        </View>
                        {(mbData?.level === 1 && item?.type === 1 && item?.isRefund) && (
                            <TouchableOpacity style={[styles.badge]} onPress={() => {}}>
                                <Text style={[styles.badgeText, { color: colors.main }]}>환불하기</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {(item?.type === 1 || item?.type === 3) && consts.flirtingOptions?.find(x => x?.valueInclude?.includes(item?.status))?.type === 'minus' ? (
                        <Text style={[styles.itemName, { color: colors.red }]}>{item?.status === 7 && "환불 "}-{numFormat(item?.amount)}원</Text>
                    ) : (
                        <Text style={styles.itemName}>{numFormat(item?.amount)}원</Text>
                    )}
                </View> */}


            </View>
        </View>
    );
}



const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        root: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            backgroundColor: colors.white,
            paddingVertical: 20
        },
        item: {
            flex: 1,
            gap: 5
        },
        badge: {
            paddingHorizontal: 8,
            height: 22,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        badgeText: {
            fontSize: 12,
            letterSpacing: -0.35,
            color: colors.white
        },
        itemDate: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.grey9
        },
        itemCount: {
            fontSize: 16,
            letterSpacing: -0.4,
            color: colors.dark,
            fontFamily: fonts.semiBold
        },
        itemName: {
            fontSize: 16,
            letterSpacing: -0.4,
            color: colors.black,
            fontFamily: fonts.medium,
        },
    });

    return { styles }
}

