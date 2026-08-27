import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, ZoomIn, FadeOut, BounceOut } from 'react-native-reanimated';
import DatePicker from 'react-native-date-picker'
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import Text from '@/components/Text';
import Button from '@/components/Button';
import ListText from '@/components/ListText';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';

import API from '@/libs/api';
import { useUser, useAlert, useConfig } from '@/libs/store';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';

export default function Component({
    title="날짜선택",
    icon=null,
    minuteInterval=1,
    defaultDate,
    minimumDate=null,
    onSubmit=()=>{}
}) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();

    const { mbData } = useUser(); 
    const { closeAlertFunc } = useAlert();
    const { configOptions } = useConfig();

    const [date, setDate] = useState(defaultDate || minimumDate || new Date())

    const onChange = (event, selectedDate) => {
        console.log('onChange', event, selectedDate);
    }
    return (
        <View style={styles.root}>
            <View 
                style={[styles.top]}
            >
                <Text style={{...rootStyle.font(20, colors.dark, fonts.semiBold), textAlign: 'center'}}>{title}</Text>

                <DatePicker 
                    minuteInterval={ minuteInterval }
                    minimumDate={minimumDate}
                    date={date} 
                    onDateChange={setDate} 
                    mode="datetime"
                    theme='light'
                    dividerColor={colors.grey6}
                    style={{ alignSelf: 'center', height: 150, width: width, paddingHorizontal: 12  }}
                />
              
                <Button 
                    type={2} 
                    onPress={() => {
                        closeAlertFunc();
                        onSubmit(date);
                    }}
                    containerStyle={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    frontIcon={icon}
                    frontIconStyle={{ width: 24, height: 24 }}
                    frontIconTintColor={colors.white}
                >
                    예약하기
                </Button>
            </View >

            <View style={styles.bottom}>
                <Button type={'7'} containerStyle={{ height: 64 }} textStyle={{ fontSize: 16 }} onPress={closeAlertFunc}>취소</Button>
            </View>
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            gap: 8,
        },
        top: {
            backgroundColor: colors.white,
            borderRadius: 24,
            gap: 20,
            overflow: 'hidden',
            paddingHorizontal: 12,
            paddingVertical: 20,
        },
        bottom: {
            borderRadius: 12,
            overflow: 'hidden',
        },
    })
  
    return { styles }
}
