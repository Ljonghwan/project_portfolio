import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Animated, { FadeIn, FadeInLeft, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import { countBy } from 'lodash';
import dayjs from 'dayjs';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import { formatToMan } from '@/libs/utils';

const today = new Date().toISOString().split('T')[0]; // 오늘 날짜

const CalendarScreen = ({
    date = dayjs().format('YYYY-MM-DD'),
    selected,
    setSelected = () => { },
    list=[],
    dayContainerStyle
}) => {
    
    const { width, heigth } = useSafeAreaFrame();

    const [markedDates, setMarkedDates] = useState({});

    useEffect(() => {
        setMarkedDates(
            list?.reduce((acc, item) => {
                acc[item.date] = { marked: (item?.total > 0 || item?.total2 > 0), total: item?.total, total2: item?.total2 };
                return acc;
            }, {})
        )
    }, [list])
    
    return (
        <View style={styles.container}>
            <Calendar
                key={date}
                current={date}
                markedDates={markedDates}
                markingType={'custom'}
                hideArrows={true}
                hideExtraDays={true}
                disableMonthChange={true}
                hideDayNames={false}
                theme={styles.theme}
                renderHeader={() => null}
                dayComponent={({ date, state, marking }) => {
                    const isMarked = marking?.marked;
                    const dateString = date.dateString;
                    const isSelected = selected === dateString;
                    const isToday = today === dateString;

                    return (
                        <TouchableOpacity
                            style={[
                                styles.dayContainer,
                                isSelected && styles.selectedDay,
                                dayContainerStyle
                            ]}
                            onPress={() => {
                                setSelected(dateString)
                            }}
                        >
                            <View 
                                entering={FadeIn}
                                style={[
                                    styles.dayText
                                ]}
                            >
                                <Text style={[
                                    styles.dateNumber,
                                    isToday && styles.todayDay,
                                ]}>
                                    {date.day}
                                </Text>
                                {isMarked && (
                                    <>
                                        {Boolean(marking?.total) && <Text style={[styles.priceText, { fontSize: width <= 330 ? 10 : 12 }]}>{formatToMan(marking?.total)}</Text>}
                                        {Boolean(marking?.total2) && <Text style={[styles.priceText, { color: colors.text4A6CFC, fontSize: width <= 330 ? 10 : 12 }]}>{formatToMan(marking?.total2)}</Text>}
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    )
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 12
    },
    dayContainer: {
        flex: 1,
        width: '100%',
        height: 90,
        paddingTop: 10
    },
    dayText: {
        alignItems: 'center',
        gap: 10
    },
    dateNumber: {
        fontSize: 14,
        color: colors.text757575,
        marginBottom: 2,
    },
    disabledDay: {
        opacity: 0.3,
    },
    priceText: {
        fontSize: 12,
        color: colors.primary,
        fontFamily: fonts.semiBold,
    },
    selectedDay: {
        backgroundColor: colors.fff6e9, // 선택한 날짜 배경색
    },
    todayDay: {
        color: colors.blue,
        fontFamily: fonts.medium
    },

    theme: {
        calendarBackground: colors.white,
        weekVerticalMargin: 0,
        // selectedDayBackgroundColor: rootStyle.fColor,
        // selectedDayTextColor: '#fff',
        // dayTextColor: '#000',
        // textDisabledColor: '#999',
        textDayHeaderFontSize: 14,
        textDayFontFamily: fonts.medium,
        textDayFontSize: 14,
        // textMonthFontWeight: 'bold',
        // textMonthFontSize: 20,
        // monthTextColor: '#000',

        'stylesheet.calendar.header': {
            dayTextAtIndex0: {
                color: colors.text313131
            },
            dayTextAtIndex1: {
                color: colors.text313131
            },
            dayTextAtIndex2: {
                color: colors.text313131
            },
            dayTextAtIndex3: {
                color: colors.text313131
            },
            dayTextAtIndex4: {
                color: colors.text313131
            },
            dayTextAtIndex5: {
                color: colors.text313131
            },
            dayTextAtIndex6: {
                color: colors.text313131
            }
        },
    }
});

export default CalendarScreen;