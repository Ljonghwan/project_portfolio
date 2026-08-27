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

import { router, usePathname, useLocalSearchParams } from "expo-router";
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
import InputAddr from '@/components/InputAddr';


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

import { useLang, useAlert, useCarpool } from '@/libs/store';

export default function Page({ }) {


    const pathname = usePathname();
    const { key, place } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { openAlertFunc } = useAlert();
    const { start, end, way, date, type, carpoolStart } = useCarpool();

    const [filter, setFilter] = useState({});

    useEffect(() => {
        setFilter({ start, end, way, date, type })
    }, [ start, end, way, date, type])

    useEffect(() => {
        if(key && place) {
            onChange({ name : key, value: JSON.parse(place) });
            router.setParams({ key: '', place: '' });
        }
    }, [key, place])

	const onChange = ({ name, value }) => {
		setFilter(prev => (
			{...prev, [name]: value}
		))
	}
    
    const submitFunc = () => {
        carpoolStart({ ...filter })
        router.dismissTo({
            pathname: routes.find,
            params: {
                back: true
            }
        })
    }
    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'filter_options' })
    };


    return (
        <Layout header={header}>
            <View style={styles.root}>
                <View style={{ flex: 1 }}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            paddingHorizontal: rootStyle.side,
                            gap: 20
                        }}
                    >
                        <View style={styles.list}>
                            <Text style={styles.label}>{lang({ id: 'departure' })}</Text>
                            <InputAddr
                                type={'start'}
                                name={'start'}
                                state={filter?.start?.name}
                                placeholder={lang({ id: 'where' })}
                                onPress={() => {
                                    console.log('!!!!!!!!');
                                    router.push({
                                        pathname: routes.searchPlace,
                                        params: {
                                            route: pathname,
                                            key: 'start'
                                        }
                                    })
                                }}
                                onReset={() => onChange({ name: 'start', value: null })}
                            />
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.label}>{lang({ id: 'destination' })}</Text>
                            <InputAddr
                                type={'end2'}
                                name={'end'}
                                state={filter?.end?.name}
                                placeholder={lang({ id: 'tell_your_destinatio' })}
                                onPress={() => {
                                    console.log('!!!!!!!!');
                                    router.push({
                                        pathname: routes.searchPlace,
                                        params: {
                                            route: pathname,
                                            key: 'end'
                                        }
                                    })
                                }}
                                onReset={() => onChange({ name: 'end', value: null })}
                            />
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.label}>
                                {lang({ id: 'date_departure' })}
                            </Text>
                            <InputDate state={filter?.date} setState={(v) => onChange({ name: 'date', value: v })} placeholder={lang({ id: 'what_date_are' })} />
                        </View>
                        <View style={styles.list}>
                            <Text style={styles.label}>{lang({ id: 'type_of_boarding' })}</Text>
                            <Radio 
                                state={filter?.type}
                                setState={(v) => onChange({ name: 'type', value: v })} 
                                list={[
                                    {idx: null, title: lang({ id: 'any' })},
                                    ...consts.carpoolTypeOptions.map(x => { 
                                        return { ...x, title: lang({ id: x.title }) } 
                                    })   
                                ]}
                            />
                        </View>
        
                    </ScrollView>
                </View>
                <View style={[{ gap: 14, paddingHorizontal: 20 }]}>
                    <Button type={2}  onPress={() => setFilter({ type: null })}>{lang({ id: 'clear' })}</Button>
                    <Button  onPress={submitFunc}>{lang({ id: 'apply' })}</Button>
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
            flex: 1,
            paddingVertical: 20,
            paddingBottom: insets?.bottom + 20,
            justifyContent: 'space-between'
        },
        
        list: {
            gap: 13,
        },
        label: {
            ...rootStyle.font(20, colors.main, fonts.extraBold)
        }
    })

    return { styles }
}
