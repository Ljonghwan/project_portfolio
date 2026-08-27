import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions, FlatList, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInLeft} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ListItem from '@/components/ListItem';

import { useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import dummy from '@/libs/dummy';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage,  } from '@/libs/utils';

const minScore = consts.minMeter;
const maxScore = consts.maxMeter;

export default function Component({
    roomIdx,
    tabNewFunc=()=>{}
}) {

    const { styles } = useStyle();
    const { configOptions } = useConfig();
    const { transparencyEnabled } = useEtc();

    const insets = useSafeAreaInsets();

    const [active, setActive] = useState(null);

    const [isLock, setIsLock] = useState(true);
    const [dayList, setDayList] = useState([]);
    const [data, setData] = useState([]);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [disabled, setDisabled] = useState(true);
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {
        if(roomIdx) dataFunc();
    }, [roomIdx])

    useEffect(() => {
        if(reload) {
            dataFunc(true);
        }
    }, [reload]);

    const dataFunc = async () => {

        let sender = {
            roomIdx: roomIdx
        }

        const { data, error } = await API.post('/v1/capsule/love', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }
        console.log('data', data);

        tabNewFunc();
        
        setIsLock(data?.isLock);
        setDayList(data?.dayList || []);
        setData(data?.list || []);

        setTimeout(() => {
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, consts.apiDelay);
    }


    const renderItem = ({ item, index }) => {

        const loveValue = Math.abs(item?.capsule?.loveValue - ( maxScore )) * 5; // 각 미터값에 따른 %
        const targetLoveValue = isLock ? 0 : Math.abs(item?.targetCapsule?.loveValue - ( maxScore ) ) * 5; // 각 미터값에 따른 %
// 
        // const loveValue = 5;
        // const targetLoveValue = 50;
       
        return (
            <Animated.View entering={Platform.OS === 'ios' ? FadeInLeft : null} style={styles.list}>
                <Text style={styles.day}>{item?.dayCount}일차</Text>
                <View>
                    <View style={styles.profileLine}>
                        <View style={[styles.profileBox, { left: `${loveValue >= 45 ? 45 : loveValue}%`, transform: [{ translateX: -12 }] } ]}>
                            <Image source={item?.capsule?.profile ? consts.s3Url + item?.capsule?.profile : images.profile} style={styles.profile} />
                        </View>
                        <View style={[styles.profileBox, { right:`${targetLoveValue >= 45 ? 45 : targetLoveValue}%`, transform: [{ translateX: 12 }]  }]}>
                            {isLock && <Image source={images.question2} style={styles.question} />}
                            <Image source={item?.targetCapsule?.profile ? consts.s3Url + item?.targetCapsule?.profile : images.profile} style={styles.profile} />
                        </View>
                    </View>

                    <View style={styles.barLine}>
                        <View style={styles.barBg}>
                            <View style={[styles.bar, { width: `${loveValue}%` }]}/>
                            <View style={[styles.bar, { right: 0, width: `${targetLoveValue}%` }]}/>
                            <View style={[styles.profileBox, { alignSelf: 'center' }]}>
                                <Image source={images.meter} style={rootStyle.default20} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.textLine}>
                        {[...Array(maxScore + 1 )]?.map((x, i) => {
                            const v = maxScore - (i * 2);
                            return (
                                <Text key={i} style={[styles.meter, v === 0 && { color: colors.dark, fontFamily: fonts.semiBold } ]}>{Math.abs(v)}M</Text>
                            )
                        })}
                    </View>
                </View>
                
                <View style={{ flex: 1 }}>
                    <View style={styles.commentBox}>
                        <Image source={item?.capsule?.profile ? consts.s3Url + item?.capsule?.profile : images.profile} style={[styles.profile, { width: 36 }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.message}>{item?.capsule?.message}</Text>
                        </View>
                    </View>
                    <View style={styles.commentBox}>
                        <Image source={item?.targetCapsule?.profile ? consts.s3Url + item?.targetCapsule?.profile : images.profile} style={[styles.profile, { width: 36 }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.message}>{item?.targetCapsule?.message}</Text>
                            {isLock && (
                                (Platform.OS === 'ios' && transparencyEnabled) ? (
                                    <View  style={[styles.blur, { backgroundColor: colors.white }]} />
                                ) : (
                                    <BlurView 
                                        style={[styles.blur]} 
                                        intensity={20} 
                                        blurReductionFactor={10} 
                                        tint='extraLight' 
                                        experimentalBlurMethod={'dimezisBlurView'} 
                                    />
                                )
                            )}
                        </View>
                    </View>
                </View>
                
                {(!item?.capsule || !item?.targetCapsule) && (
                    <BlurView 
                        style={styles.hide} 
                        intensity={Platform.OS === 'ios' ? (transparencyEnabled ? 100 : 50) : 50} 
                        experimentalBlurMethod={'dimezisBlurView'} 
                        tint={'light'} 
                    >
                        <Text style={styles.message}>{item?.dayCount}일차 러브미터가 생성되고 있어요.</Text>
                    </BlurView>
                )}

            </Animated.View>
        );
    };
    
    return (
        <View style={styles.root}>

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />}
          
            <View style={[{ flex: 1, paddingHorizontal: 20 }]}>

                <FlatList
                    indicatorStyle={'black'}
                    data={data?.filter(item => !active ? true : active === item?.dayCount )}
                    renderItem={renderItem}
                    refreshing={reload}
                    keyExtractor={(item, index) => Platform.OS === 'ios' ? active + "_" + index : index}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={styles.scroll} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ 
                        paddingBottom: insets?.bottom + 20,
                        rowGap: 8,
                        flex: data?.filter(item => !active ? true : active === item?.dayCount )?.length < 1 ? 1 : 'unset'
                        
                    }}
                    stickyHeaderIndices={[0]}
                    ListHeaderComponent={
                        <View>
                            <View style={styles.header}>
                                <Text style={[ styles.title ]}>러브미터</Text>
                                <Text style={[ styles.subTitle ]}>결정의 날 결정 후 모두 공개됩니다.</Text>
                            </View>
                            <View style={styles.filterBox} >
                                {[null, ...dayList]?.map((x, i) => {
                                    return (
                                        <TouchableOpacity key={i} activeOpacity={0.7} style={[styles.filter, active === x && { backgroundColor: colors.chat1 } ]} onPress={() => setActive(x)}>
                                            <Text style={[styles.filterText, active === x && { color: colors.white } ]}>{x ? x + '일차' : '전체'}</Text>
                                        </TouchableOpacity>
                                    )
                                    
                                })}
                            </View>
                        </View>
                        
                    }
                    ListEmptyComponent={
                        <Empty msg={'러브미터가 없습니다.'} fixed />
                    }
                />
              
            </View>

        </View>
    );
}



const useStyle = () => {

    const { width, height } = useWindowDimensions();
        
    const styles = StyleSheet.create({
        root: {
            flex: 1,
        },
        header: {
            gap: 8,
            paddingBottom: 12,
            paddingTop: 20,
            zIndex: 100,
            backgroundColor: colors.white
        },
        title: {
            color: colors.dark,
            fontSize: 20,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.5,
        },
        subTitle: {
            color: colors.grey6,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
        },

        filterBox: {
            gap: 4,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 100,
            backgroundColor: colors.white
        },
        filter: {
            width: 64,
            height: 36,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            backgroundColor: colors.greyE
        },
        filterText: {
            color: colors.greyC,
            fontSize: 14,
            lineHeight: 20,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.35,
        },
        list: {
            padding: 20,
            borderWidth: 1,
            borderColor: colors.greyE,
            borderRadius: 12,
            gap: 8,
            overflow: 'hidden'
        },
        day: {
            color: colors.dark,
            fontSize: 16,
            lineHeight: 24,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.4,
        },


        profileLine: {
            height: 24,
            marginBottom: 4,
            marginHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        profileBox: {
            position: 'absolute'
        },
        profile: {
            width: 24,
            aspectRatio: 1/1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        

        barLine: {
            paddingHorizontal: 5,
            marginBottom: 8,
        },
        barBg: {
            backgroundColor: colors.greyE,
            width: '100%',
            height: 8,
            borderRadius: 100,
            justifyContent: 'center'
        },
        bar: {
            position: 'absolute',
            backgroundColor: colors.main,
            height: '100%',
            borderRadius: 100
        },


        textLine: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        meter: {
            color: colors.grey9,
            fontSize: width > 340 ? 12 : 10,
            lineHeight: 16,
            letterSpacing: -0.3,
            width: width > 340 ? 23 : 20,
            textAlign: 'center'
        },


        commentBox: {
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomColor: colors.greyE,
            borderBottomWidth: 1
        },



        name: {
            color: colors.dark,
            fontSize: 14,
            lineHeight: 20,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.35,
            paddingLeft: 12
        },
        message: {
            color: colors.dark,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            paddingLeft: 12,
            paddingVertical: 5
        },
        blur: {
            position: 'absolute',
            top: 0,
            left: 0,
            flex: 1,
            width: '100%',
            height: '100%',
        },
        scroll: {
            flex: 1, 
            height: '100%',
        },
        

        hide: {
            ...StyleSheet.absoluteFill,
            alignItems: 'center',
            justifyContent: 'center'
        },
        question: {
            position: 'absolute',
            width: 30,
            height: 30,
            top: -30,
            left: -3,
        }






    });

    return { styles }
}


