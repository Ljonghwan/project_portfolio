import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, FadeInRight, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { throttle } from 'lodash';

import { FlashList } from "@shopify/flash-list";

import * as XLSX from 'xlsx';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import CheckBox from '@/components/CheckBox';
import Select from '@/components/Select';
import Button from '@/components/Button';

import SalesDay from '@/components/Item/SalesDay';

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
import { ToastMessage, getFullDateFormat, numFormat, formatToAbs, formatToAbsColor } from '@/libs/utils';


const sorts = [
    { idx: 1, title: '최근순' },
    { idx: 2, title: '과거순' },
    { idx: 3, title: '금액순' }
]
export default function Page({ }) {


    const { styles } = useStyle();
    const insets = useSafeAreaInsets();

    const { store } = useStore();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [startDate, setStartDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    const [all, setAll] = useState(false);
    const [sort, setSort] = useState(1);

    const [prev, setPrev] = useState(0); // 
    const [total, setTotal] = useState(0); // 
    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침


    useFocusEffect(
        useCallback(() => {
            dataFunc(true);
        }, [startDate, endDate, all, sort])
    );

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const sender = {
            startDate: startDate,
            endDate: endDate,
            all: all,
            sort: sort
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/sales/list', sender);

        setPrev(data?.prev || 0);
        setTotal(data?.list?.reduce((acc, item) => acc + item?.total, 0) || 0);
        setList(data?.list || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }

    const goLink = (item) => {

    }

    const handleDateChange = (dates) => {
        setStartDate(dates?.startDate);
        setEndDate(dates?.endDate);
    };

    const renderItem = ({ item, index }) => {

        return (
            <SalesDay style={{ borderBottomWidth: index === list?.length - 1 ? 0 : 1 }} item={item} />
        );
    };


    const exportExcel = async () => {
        try {
            openLoader();
    
            const wb = XLSX.utils.book_new();
    
            // === 1) 요약 시트 ===
            const summaryData = [
                ['매장 매출 리포트'],
                [],
                ['조회 기간', `${startDate} ~ ${endDate}`],
                ['전체 매장 매출', all ? 'Y' : 'N'],
                ['정렬', sorts.find(x => x.idx === sort)?.title],
                [],
                ['총 매출', total],
                ['전일 대비',
                    startDate === endDate && total && prev
                        ? `${((total - prev) / prev * 100).toFixed(1)}%`
                        : '-'
                ],
            ];
    
            const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    
            // 컬럼 너비
            wsSummary['!cols'] = [{ wch: 18 }, { wch: 30 }];
    
            // 총 매출 셀 숫자 포맷
            const totalCell = wsSummary['B7'];
            if (totalCell) totalCell.z = '#,##0"원"';
    
            XLSX.utils.book_append_sheet(wb, wsSummary, '요약');
    
            // === 2) 상세 시트 ===
            const detailRows = [];
    
            list.forEach((item) => {
                const dateStr = dayjs(item?.date).format('YYYY-MM-DD (dd)');
    
                if (item?.list?.length > 0) {
                    item.list.forEach((x) => {
                        detailRows.push({
                            '날짜': dateStr,
                            '항목': x?.title,
                            '건수': x?.count || 0,
                            '금액': x?.value || 0,
                        });
                    });
                    // 소계 행
                    detailRows.push({
                        '날짜': dateStr,
                        '항목': '합계',
                        '건수': item.list.reduce((acc, x) => acc + (x?.count || 0), 0),
                        '금액': item.list.reduce((acc, x) => acc + (x?.value || 0), 0),
                    });
                    // 빈 행 (날짜 구분)
                    detailRows.push({ '날짜': '', '항목': '', '건수': '', '금액': '' });
                } else {
                    detailRows.push({
                        '날짜': dateStr,
                        '항목': '내역 없음',
                        '건수': 0,
                        '금액': 0,
                    });
                    detailRows.push({ '날짜': '', '항목': '', '건수': '', '금액': '' });
                }
            });
    
            // 총합계
            detailRows.push({
                '날짜': '',
                '항목': '총 합계',
                '건수': '',
                '금액': total,
            });
    
            const wsDetail = XLSX.utils.json_to_sheet(detailRows);
    
            // 컬럼 너비
            wsDetail['!cols'] = [
                { wch: 20 },  // 날짜
                { wch: 20 },  // 항목
                { wch: 10 },  // 건수
                { wch: 15 },  // 금액
            ];
    
            XLSX.utils.book_append_sheet(wb, wsDetail, '일별 매출 상세');
    
            // === 파일 저장 & 공유 ===
            const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            const fileName = `매장매출_${startDate}_${endDate}.xlsx`;
            const file = new File(Paths.cache, fileName);
            file.write(base64, { encoding: 'base64' });
    
            await Sharing.shareAsync(file.uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: '매출 내역 내보내기',
            });
    
        } catch (e) {
            console.log('exportExcel error', e);
            ToastMessage('내보내기에 실패했습니다.');
        } finally {
            closeLoader();
        }
    };

    const header = {
        title: '매장 매출',
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


                {/* <TouchableOpacity style={styles.button}>
                    <Image source={images.exit_grey} style={rootStyle.default16} />
                    <Text style={styles.buttonText}>전체 삭제</Text>
                </TouchableOpacity> */}

                <FlashList
                    data={list}
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
                        paddingBottom: insets?.bottom + 100
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}
                    nestedScrollEnabled={true}
                    decelerationRate={'normal'}
                    ListHeaderComponent={
                        <View>
                            <View style={{ marginBottom: 15, paddingHorizontal: 36, paddingBottom: 24, borderBottomWidth: 8, borderBottomColor: colors.fafafa }}>
                                <View style={{ marginBottom: 36 }}>
                                    <DatePicker
                                        onDateChange={handleDateChange}
                                        initialStartDate={startDate}
                                        initialEndDate={endDate}
                                        max={31}
                                    >
                                        <DatePickerLabel
                                            startDate={startDate}
                                            endDate={endDate}
                                            onPrev={() => {
                                                if (load) return;
                                                setStartDate(dayjs(startDate).subtract(1, 'days').format('YYYY-MM-DD'))
                                                setEndDate(dayjs(startDate).subtract(1, 'days').format('YYYY-MM-DD'))
                                            }}
                                            onNext={() => {
                                                if (load) return;
                                                setStartDate(dayjs(endDate).add(1, 'days').format('YYYY-MM-DD'))
                                                setEndDate(dayjs(endDate).add(1, 'days').format('YYYY-MM-DD'))
                                            }}
                                        />
                                    </DatePicker>
                                </View>

                                <View style={{ gap: 16 }}>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Text style={styles.label}>총 매출</Text>
                                        <Text style={styles.price}>{numFormat(total)}원</Text>
                                    </View>
                                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                        <Text style={styles.label}>전일 대비</Text>
                                        {startDate === endDate && total && prev ? (
                                            <Text style={[styles.increment, { color: formatToAbsColor((total - prev) / prev * 100) }]}>{`${formatToAbs((total - prev) / prev * 100)}%`}</Text>
                                        ) : (
                                            <Text style={[styles.increment, { color: colors.textSecondary }]}>{`-`}</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
                                    <CheckBox
                                        type={2}
                                        label="전체 매장 매출"
                                        checked={all}
                                        onPress={() => setAll(prev => !prev)}
                                        checkboxStyle={{ width: 16 }}
                                        labelStyle={{ color: colors.primary, fontSize: 12, fontWeigth: fonts.medium }}
                                    />
                                </View>
                            </View>

                            <View style={{ paddingHorizontal: rootStyle.side }}>
                                <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                    <Text style={styles.title}>일별 매출 내역</Text>
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
                        <Empty msg={'내역이 없습니다.'} />
                    }
                />

            </View>

            <Button bottom style={{ position: 'absolute', bottom: 0 }} disabled={(list?.length < 1)} onPress={exportExcel} >매출 내역 내보내기</Button>

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
            lineHeight: 16
        },
        price: {
            color: colors.header,
            fontSize: 20,
            fontFamily: fonts.bold,
        },
        increment: {
            color: colors.blue,
            fontSize: 12,
            fontFamily: fonts.medium,
            lineHeight: 16
        },
        title: {
            color: colors.header,
            fontSize: 16,
            fontFamily: fonts.semiBold,
        }

    })

    return { styles }
}
