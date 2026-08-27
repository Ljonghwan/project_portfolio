import React, { useRef, useState, useEffect } from 'react';
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

import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// component
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Radio from '@/components/Radio';
import InputDate from '@/components/InputDate';


import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, numFormat } from '@/libs/utils';

import { useLang, useAlert } from '@/libs/store';

export default function Page({ }) {

    const { type, sdate, edate } = useLocalSearchParams();


    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { openAlertFunc } = useAlert();

    const [filter, setFilter] = useState({ type, sdate, edate });

	const onChange = ({ name, value }) => {
		setFilter(prev => (
			{...prev, [name]: value}
		))
	}
    
    const submitFunc = () => {
        router.dismissTo({
            pathname: routes.myPayment,
            params: { 
                type: filter?.type, 
                sdate: filter?.sdate, 
                edate: filter?.edate
            },
        });
        
    }
    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'payment_filter_setti' })
    };


    return (
        <Layout header={header}>
            <View style={styles.root}>
                <View style={{ gap: 25 }}>
                    <View style={[{ gap: 15, paddingHorizontal: 20 }]}>
                        <View style={{ gap: 15 }}>
                            <Text style={styles.label}>{lang({ id: 'sorting' })}</Text>
                            <Radio 
                                state={filter?.type}
                                setState={(v) => onChange({ name: 'type', value: v })}
                                list={
                                    consts.paymentFilterOptions.map(x => { 
                                        return { ...x, title: lang({ id: x.title }) } 
                                    })
                                }
                            />
                        </View>
                        <View style={{ gap: 15 }}>
                            <Text style={styles.label}>{lang({ id: 'date_range' })}</Text>
                            <InputDate state={filter?.sdate} setState={(v) => onChange({ name: 'sdate', value: v })} placeholder={lang({ id: 'start_date' })}/>
                            <InputDate state={filter?.edate} setState={(v) => onChange({ name: 'edate', value: v })} placeholder={lang({ id: 'end_date' })}/>
                        </View>
                    </View>
    
                    <View style={[rootStyle.flex, { gap: 14, paddingHorizontal: 20 }]}>
                        <Button style={{ flex: 1 }} onPress={submitFunc}>{lang({ id: 'apply' })}</Button>
                    </View>
                </View>
            </View>
        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            paddingVertical: 20,
        },
        
        top: {
            alignSelf: 'flex-end',
            marginBottom: 8
        },
        title: {
            fontSize: 20,
            color: colors.main,
            fontFamily: fonts.extraBold,
            textAlign: 'center',
        },
        label: {
            fontSize: 18,
            color: colors.main,
            fontFamily: fonts.medium,
            letterSpacing: -0.36
        }
    })

    return { styles }
}
