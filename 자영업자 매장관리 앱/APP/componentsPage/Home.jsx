import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, useWindowDimensions, RefreshControl, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeInLeft, useSharedValue } from 'react-native-reanimated';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';

import Tab from '@/components/Ui/Tab';
import SalesChart from '@/components/Ui/SalesChart';

import ItemChange from '@/components/Item/ItemChange';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

import { numFormat, ToastMessage, formatToAbs } from '@/libs/utils';
import { useUser, useStore, useAlert, useLoader } from '@/libs/store';

import protectedStoreRouter from '@/libs/protectedStoreRouter';


export default function Page() {

    const tabBarHeight = useBottomTabBarHeight();

    const { styles } = useStyle();

    const { width } = useSafeAreaFrame();

	const { mbData } = useUser();
	const { store } = useStore();

    const [tab1, setTab1] = useState(1);
    const [tab2, setTab2] = useState(1);

    const [yesterDay, setYesterDay] = useState(0); 
    const [prevDay, setPrevDay] = useState(0); 
    const [lastUpdated, setLastUpdated] = useState(null); 

    const [chart, setChart] = useState([]); 
    const [deposit, setDeposit] = useState([]); 
    const [expenditure, setExpenditure] = useState([]); 
    const [personnel, setPersonnel] = useState([]); 
    const [maintenance, setMaintenance] = useState(0); 
    const [priceChanges, setPriceChanges] = useState([]); 

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [reload, setReload] = useState(false); // 새로고침
    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);


    useFocusEffect(
        useCallback(() => {
            console.log('useFocusEffect');
            dataFunc();
        }, [store?.idx])
    );

    useEffect(() => {
        if(reload) dataFunc();
    }, [reload])

    const dataFunc = async () => {

        setLoad(true);
        
        const { data, error } = await API.post('/v1/main/home');
        // console.log('data', data)

        if(error) {
            ToastMessage(error?.message);
            return;
        }
        setYesterDay(data?.yesterDay);
        setPrevDay(data?.prevDay);
        setLastUpdated(data?.lastUpdated);

        setChart(data?.chart);
        setDeposit(data?.deposit);
        setExpenditure(data?.expenditure);
        setPersonnel(data?.personnel);
        setMaintenance(data?.maintenance);
        setPriceChanges(data?.priceChanges);

        setTimeout(() => {
            setInitLoad(false);
            setLoad(false);
            setReload(false);
        }, consts.apiDelay)


        // setEventList(data?.eventList || []);
        // setSquareList(_.chunk(data?.squareList, 4));
        // setTeamList(_.chunk(data?.teamList, 3));
        // setFeedList(data?.feedList || []);

    }

    const reloadFunc = async () => {

        const { data, error } = await API.post('/v1/main/reload');
        console.log('data', data, error);

        if(error) {
            ToastMessage(error?.message);
            return;
        }

    }

    return (
        <Animated.View entering={FadeIn} style={{ flex: 1 }}>

            {initLoad && ( <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.fafafa }} fixed /> )}

            {/* {!store && (
                <View style={styles.emptyContainer}>
                    <Text style={{...rootStyle.font(14, colors.text757575, fonts.semiBold)}}>매장 등록이 필요합니다.</Text>
                    <Button containerStyle={styles.viewButton} onPress={() => {
                        router.push(routes.storeAdd);
                    }}>
                        매장 등록
                    </Button>
                </View>
            )} */}

            <ScrollView
                style={styles.root}
                contentContainerStyle={{
                    paddingTop: 10,
                    paddingBottom: tabBarHeight + 40
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={reload} onRefresh={() => setReload(true)} />
                }
            >
                {/* 오늘 매출 카드 */}
                <Pressable style={styles.salesCard} onPress={() => {
                    // router.push({})
                    // router.push('example-datepicker');
                    protectedStoreRouter.push(routes.storeSales);
                }}>
                    <Text style={styles.salesCardTitle}>어제 매출</Text>
                    <View style={styles.salesAmountRow}>
                        {store ? (
                            <Text style={styles.salesAmount}>{numFormat(yesterDay)} 원 {width <= 330 ? `\n` : ''}<Text style={styles.salesCompare}>전일 대비 {formatToAbs((yesterDay - prevDay) / prevDay * 100)}%</Text></Text>
                        ) : (
                            <Text style={styles.salesAmount}>??? 원</Text>
                        )}
                        <Image source={images.right_white} style={rootStyle.default} />
                    </View>

                    <View style={styles.salesTimeRow}>
                        {/* <TouchableOpacity onPress={reloadFunc}>
                            <Image source={images.refresh} style={rootStyle.default18} />
                        </TouchableOpacity> */}
                        <Text style={styles.salesTime}>{dayjs().format('YYYY.MM.DD (dd) HH:mm')} 기준</Text>
                    </View>
                </Pressable>




                {/* 자금 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>자금</Text>

                    {/* 탭 */}
                    <Tab
                        style={styles.tabContainer}
                        tabs={[
                            { key: 1, title: '들어올 돈' },
                            { key: 2, title: '나갈 돈' },
                        ]}
                        active={tab1}
                        setActive={setTab1}
                    />


                    {tab1 === 1 ? (
                        // 입금 리스트 
                        <Animated.View key={'tab1_1'} entering={FadeInLeft}>
                            {deposit?.map((item, index) => {
                                let isToday = item?.label === dayjs().format('YYYY-MM-DD');
                                return (
                                    <View key={index} style={styles.depositItem}>
                                        <ImageBackground source={isToday ? images.calendar_today_bg : images.calendar_bg} style={[styles.dateIcon]}>
                                            {index === deposit?.length - 1 ? (
                                                <Text style={[styles.dateText, styles.dateTextInactive]}>~{dayjs(item?.label).format('DD')}</Text>
                                            ) : (
                                                <Text style={[styles.dateText, !isToday && styles.dateTextInactive]}>{dayjs(item?.label).format('DD')}</Text>
                                            )}
                                        </ImageBackground>
                                        <View style={styles.depositInfo}>
                                            <Text style={styles.depositAmount}>{store ? numFormat(item?.value) : '???'}원</Text>
                                            <Text style={styles.depositDescription} numberOfLines={2}>{item?.items?.join(", ")}</Text>
                                        </View>
                                        {/* {isToday && (
                                            <TouchableOpacity style={styles.confirmButton}>
                                                <Text style={styles.confirmButtonText}>입금 확인</Text>
                                            </TouchableOpacity>
                                        )} */}
                                    </View>
                                )
                            })}
                            <Button type="3" containerStyle={styles.viewButton} onPress={() => {
                                protectedStoreRouter.push(routes.storeCalendar)
                            }}>
                                입금 캘린더 보기
                            </Button>
                        </Animated.View>
                    ) : (
                        // 지출 리스트 
                        <Animated.View key={'tab1_2'} entering={FadeInLeft}>
                           {expenditure?.map((item, index) => {
                                let isToday = item?.label === dayjs().format('YYYY-MM-DD');
                                return (
                                    <View key={index} style={styles.depositItem}>
                                        <ImageBackground source={isToday ? images.calendar_today_bg : images.calendar_bg} style={[styles.dateIcon]}>
                                            <Text style={[styles.dateText, !isToday && styles.dateTextInactive]}>{dayjs(item?.label).format('DD')}</Text>
                                        </ImageBackground>
                                        <View style={styles.depositInfo}>
                                            <Text style={styles.depositAmount}>{store ? numFormat(item?.value) : '???'}원</Text>
                                            <Text style={styles.depositDescription} numberOfLines={2}>{item?.items?.join(", ")}</Text>
                                        </View>
                                    </View>
                                )
                            })}
                            <Button type="3" containerStyle={styles.viewButton} onPress={() => {
                                protectedStoreRouter.push(routes.storeExpenditure)
                            }}>
                                자세히 보기
                            </Button>
                        </Animated.View>
                    )}

                </View>

                {/* 장부 섹션 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>장부</Text>
                        <Text style={styles.dateRange}>{`${dayjs().startOf('month').format('M월 D일')} ~ ${dayjs().endOf('month').format('M월 D일')} 기준`}</Text>
                    </View>

                    <View style={styles.totalSalesRow}>
                        <Text style={styles.totalSalesLabel}>이번 달 총 매출</Text>
                        <Text style={styles.totalSalesAmount} numberOfLines={1}>{store ? numFormat(chart?.reduce((acc, item) => acc + item?.value, 0)) : '???'}원</Text>
                    </View>

                    {/* <View style={styles.divider} /> */}

                    <SalesChart data={chart} />

                    <Button type="3" containerStyle={styles.viewButton} onPress={() => {
                        protectedStoreRouter.push(routes.storeAccountBook)
                    }}>
                        자세히 보기
                    </Button>
                </View>

                {/* 일별 고정비 현황 섹션 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>일별 고정비 현황</Text>
                        <Text style={styles.dateRange}>{dayjs().format('YYYY.MM.DD')} 기준</Text>
                    </View>

                    {/* 탭 */}
                    <Tab
                        style={styles.tabContainer}
                        tabs={[
                            { key: 1, title: '인건비' },
                            { key: 2, title: '관리비' },
                        ]}
                        active={tab2}
                        setActive={setTab2}
                    />

                    {tab2 === 1 ? (
                        <Animated.View key={'tab2_1'} entering={FadeInLeft}>
                            <View style={styles.laborCostRow}>
                                <Text style={styles.laborCostLabel}>오늘 인건비 총액</Text>
                                <Text style={styles.laborCostAmount}>{store ? numFormat(personnel?.reduce((acc, item) => acc + item?.value, 0)) : '???'}원</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.laborCostDetail}>
                                {personnel?.map((x, i) => (
                                    <Text key={i} style={styles.laborCostDetailText}>• {x?.label}</Text>
                                ))}
                            </View>
                            
                            <Button type="3" containerStyle={styles.viewButton} onPress={() => {
                                protectedStoreRouter.push(routes.storePersonnel)
                            }}>
                                자세히 보기
                            </Button>
                        </Animated.View>
                    ) : (
                        <Animated.View key={'tab2_2'} entering={FadeInLeft}>
                            <View style={styles.laborCostRow}>
                                <Text style={styles.laborCostLabel}>오늘 관리비 총액</Text>
                                <Text style={styles.laborCostAmount}>{store ? numFormat(Math.round(maintenance / dayjs().daysInMonth())) : '???'}원</Text>
                            </View>

                            <View style={styles.divider} />
                        
                            <View style={styles.laborCostDetail}>
                                <Text style={styles.laborCostDetailText}>• 정기 관리비 총합(월): {store ? numFormat(maintenance) : '???'}원</Text>
                                <Text style={styles.laborCostDetailText}>• 일별 환산(월 정기비용 ÷ {dayjs().daysInMonth()}일): {store ? numFormat(Math.round(maintenance / dayjs().daysInMonth())) : '???'}원</Text>
                            </View>

                            <Button type="3" containerStyle={styles.viewButton} onPress={() => {
                                protectedStoreRouter.push(routes.storeExpenditure)
                            }}>
                                자세히 보기
                            </Button>
                        </Animated.View>
                    )}


                </View>

                {/* 원가 변동 알림 섹션 */}
                <View style={[styles.section, styles.lastSection]}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>원가 변동 알림</Text>
                        <Text style={styles.dateRange}>{dayjs().format('YYYY.MM.DD')} 기준</Text>
                    </View>

                    {priceChanges?.length > 0 ? (
                        <>
                            {priceChanges?.map((item, index) => (
                                <ItemChange key={index} item={item} mode='home' />
                            ))}
                            <Button type="3" containerStyle={styles.viewButton} onPress={() => {
                                protectedStoreRouter.push({
                                    pathname: routes.myNews,
                                    params: { activeTab: 1 }
                                });
                            }}>
                                전체 보기
                            </Button>
                        </>
                    ) : (
                        <Empty msg={'원가 변동 알림이 없습니다.'} style={{ height: 200, paddingBottom: 0 }} />
                    )}

                </View>

            </ScrollView>
       </Animated.View>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.fafafa,
        },
        emptyContainer: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: '#FAFAFA99',
            padding: 30,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            gap: 20
        },
        topHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 26,
            paddingTop: 14,
            paddingBottom: 17,
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        headerTitle: {
            fontSize: 16,
            fontFamily: fonts.semiBold,
            color: colors.black,
        },
        dropdownIcon: {
            width: 18,
            height: 18,
        },
        bellIcon: {
            width: 24,
            height: 24,
        },
        salesCard: {
            backgroundColor: colors.primary,
            marginHorizontal: 26,
            marginBottom: 14,
            borderRadius: 20,
            paddingTop: 25,
            paddingBottom: 18,
            paddingLeft: 23,
            paddingRight: 14,
        },
        salesCardTitle: {
            fontSize: 16,
            fontFamily: fonts.bold,
            color: colors.white,
            marginBottom: 12,
        },
        salesAmountRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        salesAmount: {
            fontSize: 24,
            fontFamily: fonts.bold,
            color: colors.white,
            flexShrink: 1
        },
        arrowRight: {
            width: 24,
            height: 24,
            tintColor: colors.white,
        },
        salesCompare: {
            fontSize: 12,
            fontFamily: fonts.medium,
            color: colors.white,
        },
        salesTimeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 6,
            gap: 8,
        },
        refreshIcon: {
            width: 18,
            height: 18,
            tintColor: colors.white,
        },
        salesTime: {
            fontSize: 14,
            fontFamily: fonts.medium,
            color: colors.white,
        },
        section: {
            backgroundColor: colors.white,
            marginHorizontal: 26,
            marginBottom: 14,
            borderRadius: 10,
            paddingHorizontal: 23,
            paddingTop: 18,
            paddingBottom: 25,
        },
        lastSection: {
            paddingBottom: 20,
        },
        sectionTitle: {
            fontSize: 16,
            fontFamily: fonts.bold,
            color: colors.header,
        },
        sectionHeaderRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        dateRange: {
            fontSize: 10,
            fontFamily: fonts.medium,
            color: colors.textA6A6A6,
        },
        tabContainer: {
            marginTop: 15,
            marginBottom: 18,
        },

        depositItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 18,
        },
        dateIcon: {
            width: 42,
            height: 42,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
        },
        dateIconInactive: {
            backgroundColor: '#F5F5F5',
        },
        dateText: {
            fontSize: 10,
            fontFamily: fonts.semiBold,
            color: colors.orange,
            paddingTop: 12
        },
        dateTextInactive: {
            color: colors.text8A93A2,
        },
        depositInfo: {
            flex: 1,
        },
        depositAmount: {
            fontSize: 16,
            fontFamily: fonts.bold,
            color: colors.header,
            marginBottom: 4,
        },
        depositDescription: {
            fontSize: 10,
            fontFamily: fonts.medium,
            color: colors.textA6A6A6,
        },
        confirmButton: {
            backgroundColor: colors.backgroundLight,
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 10,
        },
        confirmButtonText: {
            fontSize: 12,
            fontFamily: fonts.semiBold,
            color: colors.text2B2B2B,
        },
        viewButton: {
            marginTop: 13,
        },
        totalSalesRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10
        },
        totalSalesLabel: {
            fontSize: 12,
            fontFamily: fonts.medium,
            color: colors.textA6A6A6,
        },
        totalSalesAmount: {
            fontSize: 20,
            fontFamily: fonts.bold,
            color: colors.header,
            textAlign: 'right',
            flexShrink: 1,
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
        },
        laborCostRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        laborCostLabel: {
            fontSize: 12,
            fontFamily: fonts.medium,
            color: colors.textA6A6A6,
        },
        laborCostAmount: {
            fontSize: 20,
            fontFamily: fonts.bold,
            color: colors.header,
            textAlign: 'right',
            flexShrink: 1,
        },
        laborCostDetail: {
            paddingVertical: 16,
        },
        laborCostDetailText: {
            fontSize: 12,
            fontFamily: fonts.medium,
            color: colors.textA6A6A6,
            lineHeight: 22,
        },



    })

    return { styles }
}
