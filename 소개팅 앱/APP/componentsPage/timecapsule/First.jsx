import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, FlatList } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInLeft} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ListItem from '@/components/ListItem';

import { useUser, useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import dummy from '@/libs/dummy';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage,  } from '@/libs/utils';

export default function Component({
    roomIdx,
    tabNewFunc=()=>{}
}) {

    const { mbData } = useUser();
    const { configOptions } = useConfig();
    const { transparencyEnabled } = useEtc();

    const insets = useSafeAreaInsets();

    const [isLock, setIsLock] = useState(true);
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

        const { data, error } = await API.post('/v1/capsule/firstComment', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        tabNewFunc();
        
        setIsLock(data?.isLock);
        setData(data?.list || []);

        setTimeout(() => {
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, consts.apiDelay);
    }


    const renderItem = ({ item, index }) => {
        return (
            <View style={styles.list}>
                <Image source={item?.profile ? consts.s3Url + item?.profile : images.profile} style={styles.profile} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item?.name}</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.message}>{item?.message}</Text>
                        {/* <Image source={consts.s3Url + `/makeBlur?text=${item?.message}`} style={{ width: '100%', height: 30 }} contentFit='fill'/> */}

                        {(isLock && item?.userIdx !== mbData?.idx) ? 
                            (Platform.OS === 'ios' && transparencyEnabled) ? (
                                <View style={[styles.blur, { backgroundColor: colors.white }]} />
                                // <BlurView style={[styles.blur]} intensity={20} blurReductionFactor={10} tint='prominent' experimentalBlurMethod={'dimezisBlurView'}/>
                            ) : (
                                <BlurView style={[styles.blur]} intensity={20} blurReductionFactor={10} tint='extraLight' experimentalBlurMethod={'dimezisBlurView'}/>
                            )
                        : (
                            <></>
                        )}
                    </View>
                </View>
            </View>
        );
    };
    
    return (
        <View style={styles.root}>

            {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />}
          
            <View style={[{ flex: 1, paddingHorizontal: 20 }]}>

                <FlatList
                    indicatorStyle={'black'}
                    data={data}
                    renderItem={renderItem}
                    refreshing={reload}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={styles.scroll} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ 
                        paddingTop: 20,
                        paddingBottom: insets?.bottom + 20,
                        flex: data?.length < 1 ? 1 : 'unset'
                    }}
                    ListHeaderComponent={
                        <View style={styles.header}>
                            <Text style={[ styles.title ]}>첫인상</Text>
                            <Text style={[ styles.subTitle ]}>내용은 3일차에 개봉됩니다.</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <Empty msg={'첫인상이 없습니다.'} fixed />
                    }
                />
              
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        gap: 8,
        paddingBottom: 12
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
    list: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.greyE,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    profile: {
        width: 36,
        aspectRatio: 1/1,
        borderRadius: 1000,
        backgroundColor: colors.placeholder
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
        color: colors.grey6,
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
        paddingLeft: 12,
        paddingVertical: 5,
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
    








});
