import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from "expo-router";

import dayjs from 'dayjs';

import Text from '@/components/Text';
import Loading from '@/components/Loading';

import Rematch from '@/components/popups/Rematch';
import RematchNormal from '@/components/popups/RematchNormal';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import routes from '@/libs/routes';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import images from '@/libs/images';

import { numFormat, elapsedTime } from '@/libs/utils';

import { useUser, useAlert } from '@/libs/store';


export default function Component({
    style,
    isSale,
    item=null,
    time=null,
    product=[],
    dataFunc=()=>{}
}) {

    const { mbData } = useUser();
    const { openAlertFunc, closeAlertFunc } = useAlert();

    const calculateRemaining = () => {
        const now = dayjs();
        const diffSec = Math.floor(dayjs(time).diff(now, 'second'));
        return diffSec > 0 ? diffSec : 0;
    };

    const [remaining, setRemaining] = useState(calculateRemaining());
    const [pay, setPay] = useState( product?.find(x => x?.type === (isSale ? 3 : 2)) );
    const [load, setLoad] = useState(false);

    useEffect(() => {

        const interval = setInterval(() => {
            setRemaining(calculateRemaining());
        }, 1000);

        return () => clearInterval(interval);
        
    }, []);

    useEffect(() => {

        setPay(product?.find(x => x?.type === (isSale ? 3 : 2)))

    }, [isSale]);
    
    useEffect(() => {

        if(remaining === 0 && isSale) {
            setLoad(true);
            closeAlertFunc();
            setTimeout(() => {
                dataFunc(true);
                setLoad(false);
            }, 1000)
        }

    }, [remaining])

    const formatTime = (ms) => {
        const hours = String(Math.floor(ms / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((ms % 3600) / 60)).padStart(2, '0');
        const seconds = String(ms % 60).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const rematchAlert = () => {
        if(mbData?.flirting < 10) {
            openAlertFunc({
                label: `리매치 신청`,
                title: `플러팅이 최소 10개 이상 있어야\n리매치 신청이 가능합니다`,
                onCencleText: "취소",
                onPressText: "구매하기",
                onPress: () => {
                    router.navigate(routes.paymentProduct)
                }
            })
            return;
        }

        openAlertFunc({
            component: isSale ? <Rematch item={item} time={formatTime(remaining)} product={product}/> : <RematchNormal item={item} time={formatTime(remaining)} pay={pay}/>,
            componentStyle: { padding: 0, paddingTop: 0 },
            input: 150
        })
       
    }


    return (
        <View>
            {load && ( <Loading color={colors.black} style={{ backgroundColor: 'rgba(255,255,255, 0.5)', paddingBottom: 0 }} fixed /> )}
            
            <View style={{ paddingHorizontal: 20 }} >
            
                <View style={[styles.item, style]}>
                    <Image source={item?.user?.profile ? consts.s3Url + item?.user?.profile : images.profile} style={styles.itemImage}/>
                    
                    <View style={[rootStyle.flex, { flex: 1, alignItems: 'flex-end', justifyContent: 'space-between' }]}>
                        <View style={{ flex: 1, gap: 4 }}>
                            <View style={[rootStyle.flex, { gap: 8, justifyContent: 'flex-start' }]}>
                                <Text style={styles.itemName}>{item?.user?.name}</Text>

                                {remaining > 0 && (
                                    <View style={[rootStyle.flex, { gap: 4, justifyContent: 'flex-start' }]}>
                                        <Image source={images.clock} style={rootStyle.default} />
                                        <Text style={styles.itemTime}>{formatTime(remaining)}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.itemName}>
                                <Text style={styles.itemSpan}>지난 소개 </Text>
                                {item?.prevCreateAt ? dayjs(item?.prevCreateAt).format('YYYY.MM.DD') : ""}
                            </Text>
                            {/* <Text style={styles.itemName}>
                                <Text style={styles.itemSpan}>타임 아웃 </Text>
                                {dayjs(item?.limitAt).format('YYYY.MM.DD HH:mm:ss')}
                            </Text> */}
                            <Text style={styles.itemName}>
                                <Text style={styles.itemSpan}>총 소개 횟수 </Text>
                                {numFormat(item?.count)}회
                            </Text>
                        </View>

                        <View style={[rootStyle.flex, { gap: 8, alignItems: 'flex-end' }]}>
                            <TouchableOpacity style={styles.timecapsule} onPress={() => {
                                router.navigate({
                                    pathname: routes.chatTimecapsule,
                                    params: {
                                        roomIdx: item?.prevRoomIdx
                                    }
                                })
                            }}>
                                <Image source={images.chat_header_time} style={{ width: '100%', height: '100%' }} />
                                <Image source={item?.user?.profile ? consts.s3Url + item?.user?.profile : images.profile} style={styles.capsuleProfile}/>
                            </TouchableOpacity>


                            {item?.user?.status === 9 ? (
                                <Text style={styles.itemLeave}>탈퇴 회원</Text>
                            ) : (
                                item?.status === 1 ? (
                                    <View style={{ gap: 8, alignItems: 'flex-end' }}>
                                        <Text style={styles.itemName}>{`${numFormat(pay?.price)}원`}</Text>

                                        <TouchableOpacity style={styles.button} onPress={rematchAlert}>
                                            <Image source={images.refresh} style={rootStyle.default20} />
                                            <Text style={styles.buttonText}>리매치</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : item?.status === 2 ? (
                                    <View style={{ gap: 8, alignItems: 'center' }}>
                                        <View style={styles.dot}/>
                                        <Text style={[styles.itemName, { color: colors.main }]}>수락 대기 중</Text>
                                    </View>
                                ) : item?.status === 3 ? (
                                    <View style={{ gap: 8, alignItems: 'flex-end' }}>
                                        <Text style={[styles.itemName, { color: colors.main }]}>수락됨</Text>

                                        <TouchableOpacity style={[styles.button, { backgroundColor: colors.main }]} onPress={() => {
                                            router.navigate({
                                                pathname: routes.chatRoom,
                                                params: {
                                                    idx: item?.roomIdx,
                                                }
                                            })
                                        }}>
                                            <Text style={[styles.buttonText, { color: colors.white }]}>채팅방</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={{ gap: 8, alignItems: 'center' }}>
                                        <View style={[styles.dot, { backgroundColor: colors.red }]}/>
                                        <Text style={[styles.itemName, { color: colors.red }]}>거절되었습니다</Text>
                                    </View>
                                )
                                
                            )}
                            

                        </View>
                    </View>
                </View>
                
            </View>
        </View>

    );
}

const styles = StyleSheet.create({
    item: {
        flex: 1,
        paddingVertical: 16,
        borderBottomColor: colors.greyE,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    itemImage: {
        width: 48,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.placeholder
    },
    
    itemName: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.dark,
        fontFamily: fonts.semiBold,
    },
    itemSpan: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.grey9,
        fontFamily: fonts.semiBold,
    },
    itemTime: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.dark,
    },
    itemLeave: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.greyC,
        fontFamily: fonts.semiBold
    },


    timecapsule: {
        width: 40,
        aspectRatio: 1/1,
        borderRadius: 1000,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
    },
    capsuleProfile: {
        width: 14,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.placeholder,
        position: 'absolute',
        right: 6,
        bottom: 6,
        borderWidth: 1.5,
        borderColor: colors.main
    },


    button: {
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: colors.mainOp5
    },
    buttonText: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        color: colors.main,
        fontFamily: fonts.semiBold,
    },

    dot: {
        width: 12,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.main
    }
});
