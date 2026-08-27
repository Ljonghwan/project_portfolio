import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInLeft} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from "expo-router";
import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ListItem from '@/components/ListItem';

import { useConfig } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';
import routes from '@/libs/routes';

import API from '@/libs/api';

import { ToastMessage,  } from '@/libs/utils';

export default function Component({
    roomIdx,
    prevRoomIdx,
    tabNewFunc=()=>{}
}) {

    const { configOptions } = useConfig();
    const insets = useSafeAreaInsets();

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

        const { data, error } = await API.post('/v1/capsule/freeChat', sender);

        if (error) {
            ToastMessage(error?.message);
            return;
        }

        tabNewFunc();
        
        setData(data);

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
                <View style={{ gap: 4, flex: 1 }}>
                    <Text style={styles.name}>{item?.name}</Text>
                    <Text style={styles.message}>{item?.message}</Text>
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
                            <Text style={[ styles.title ]}>프리뷰 챗</Text>
                            <Text style={[ styles.subTitle ]}>피드백이 공개 되었습니다.</Text>
                        </View>
                    }
                    ListFooterComponent={
                        prevRoomIdx ? (
                            <TouchableOpacity style={styles.freeview} activeOpacity={0.7} onPress={() => {
                                router.navigate({
                                    pathname: routes.chatRoomViewer,
                                    params: {
                                        idx: prevRoomIdx,
                                    }
                                })
                            }}>
                                <Image source={images.freeview_go} style={styles.freeview_go} />
                                <Text style={styles.freeviewText}>프리뷰 챗 다시보기</Text>
                            </TouchableOpacity>
                            
                        ) : (
                            <></>
                        )
                    }
                    ListEmptyComponent={
                        <Empty msg={'피드백이 없습니다.'} fixed />
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
        gap: 12
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
    },
    message: {
        color: colors.grey6,
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.35,
    },
    scroll: {
        flex: 1, 
        height: '100%',
    },

    freeview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: colors.chat1,
        height: 52,
        borderRadius: 8,
        marginTop: 12
    },
    freeview_go: {
        width: 17.4,
        aspectRatio: 1/1
    },
    freeviewText: {
        color: colors.white,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.4,
        fontFamily: fonts.semiBold,
    }







});
