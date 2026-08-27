import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeInRight, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { groupBy } from 'lodash';

import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import CheckBox from '@/components/CheckBox';
import Select from '@/components/Select';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';

import Menu from '@/components/Item/Menu';

import Tag from '@/components/Ui/Tag';
import Calendar from '@/components/Ui/Calendar';
import DatePicker from '@/components/Ui/DatePicker';
import DatePickerLabel from '@/components/Ui/DatePickerLabel';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useStore, useAlert, useLoader } from '@/libs/store';
import { ToastMessage, getFullDateFormat, numFormat, imageViewer } from '@/libs/utils';


const sorts = [
    { idx: '', title: '상태 전체' },
    { idx: 1, title: '서명 대기' },
    { idx: 2, title: '서명 완료' },
]

export default function Page({ }) {

    const { sdate, edate } = useLocalSearchParams();

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [sort, setSort] = useState('');

    const [list, setList] = useState([]); // 
    const [viewList, setVeiwList] = useState([]); // 

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    useFocusEffect(
        useCallback(() => {
            dataFunc(true);
        }, [])
    );

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);


    useEffect(() => {

        setVeiwList(
            list?.filter(x => (!sort || (x?.staff?.cert === sort))  )
        );

    }, [list, sort])

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const { data, error } = await API.post('/v1/work08/list');
        console.red('data', data?.[0]?.staff);
        setList(data || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }
    
    const sendFunc = async (idx) => {

        openAlertFunc({
            label: `해당 근로자에게 서명 요청 MMS를\n다시 발송하시겠습니까?`,
            onCencleText: '취소',
            onPressText: '발송',
            onPress: async () => {

                const { data, error } = await API.post('/v1/work08/send', { idx });

                if (error) {
                    ToastMessage(error?.message);
                    return;
                }

                ToastMessage('서명 요청을 다시 발송했어요.');
            }
        })
    }

    const printFunc = async () => {
        console.log('printFunc');
    }


    const renderItem = ({ item, index }) => {
        console.log('item', item.contract);
        return (
            <View style={styles.item} >
                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                    <View style={[rootStyle.flex, { gap: 7 }]}>
                        <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold), flexShrink: 1 }} numberOfLines={1} >{item?.staff?.name}</Text>
                        {item?.type === 1 ? (
                            <Tag type={5} tag={'일용직'} />
                        ) : (
                            <Tag type={item?.status === 9  ? 4 : dayjs(item?.edate).isBefore(dayjs()) ? 3 : 2} tag={item?.status === 9 ? '퇴사' : dayjs(item?.edate).isBefore(dayjs()) ? '근무종료' : '재직'} />
                        )}
                        
                    </View>
                    
                    <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium) }}>{dayjs(item?.staff?.sdate).format('YYYY.MM.DD')}</Text>
                </View>

                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                    <Text style={{ ...rootStyle.font(14, colors.text757575, fonts.medium)}}>계약상태</Text>
                    <Text style={{ ...rootStyle.font(16, colors.header, fonts.semiBold) }}>{item?.staff?.cert === 1 ? '서명 대기' : '서명 완료'}</Text>
                </View>

                <View style={[rootStyle.flex, { gap: 9 }]}>
                    <Button 
                        type={1} 
                        style={{ width: 'auto', flex: 1 }} 
                        containerStyle={{ borderRadius: 4, height: 36 }} 
                        textStyle={{ fontSize: 14 }}
                        onPress={() => {
                            router.push({
                                pathname: routes.계약서보기,
                                params: { idx: item?.idx }
                            });
                        }}
                    >
                        {'계약서 보기'}
                    </Button>
                    {/* <Button 
                        type={9} 
                        style={{ width: 'auto', flex: 1 }} 
                        containerStyle={{ borderRadius: 4, height: 36 }} 
                        textStyle={{ fontSize: 14 }}
                        onPress={() => {
                            if(item?.cert === 1) sendFunc(item?.idx);
                            else printFunc();
                        }}
                    >
                        {item?.cert === 1 ? '서명 요청' : '출력 하기'}
                    </Button> */}
                </View>
            </View>
        );
    };

    const header = {
        title: '계약서 관리',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };

    return (
        <Layout header={header} >

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={{ flex: 1 }}>
                <FlashList
                    data={viewList}
                    renderItem={renderItem}
                    numColumns={1}
                    refreshing={reload}
                    removeClippedSubviews
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingTop: 10,
                        paddingBottom: insets?.bottom + 20,
                        paddingHorizontal: 36,
                        flex: viewList?.length < 1 ? 1 : 'unset',
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}
                    decelerationRate={'normal'}
                    ListHeaderComponent={
                        <View style={{ marginBottom: 8 }}>
                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <Text style={{ ...rootStyle.font(14, colors.primary, fonts.medium) }}>총 {numFormat(viewList?.length)}명</Text>
                                <View style={[rootStyle.flex, { gap: 7 }]}>
                                    <Select
                                        state={sort}
                                        setState={setSort}
                                        list={sorts}
                                        style={rootStyle.default}
                                    >
                                        <Button type={4} icon={'down'} pointerEvents="none">{sorts?.find(x => x?.idx === sort)?.title}</Button>
                                    </Select>
                                </View>
                            </View>
                        </View>

                    }
                    ListEmptyComponent={
                        <Empty msg={'내역이 없습니다.'} style={{ paddingBottom: 0 }} />
                    }
                />

            </View>
        </Layout>
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        label: {
            color: colors.text757575,
            fontSize: 12,
            fontFamily: fonts.medium,
            lineHeight: 24
        },
        price: {
            color: colors.header,
            fontSize: 20,
            fontFamily: fonts.bold,
        },

        item: {
            marginBottom: 9,
            borderRadius: 10,
            backgroundColor: colors.fafafa,
            paddingHorizontal: 24,
            paddingVertical: 22,
            gap: 20,
        }

    })

    return { styles }
}
