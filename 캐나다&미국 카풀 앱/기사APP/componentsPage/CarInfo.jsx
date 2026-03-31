import React, { useRef, useState, useEffect, useCallback, use } from 'react';
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
    Platform,
    Dimensions,
    useWindowDimensions,
    RefreshControl,
    ActivityIndicator,
    Pressable
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Rating } from '@kolking/react-native-rating';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Tag from '@/components/Tag';
import Empty from '@/components/Empty';

import EditCarInfo from '@/components/Popup/EditCarInfo';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, imageViewer } from '@/libs/utils';

import { useAlert, useEtc, useUser, useConfig } from '@/libs/store';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8; // 카드 실제 크기 (80%)
const SPACING = 20;             // 카드 간격

export default function Page({ item, edit, reload, setReload, jumpTo, dataFunc }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const { token, mbData, login, logout } = useUser();
    const { badges } = useConfig();

    const { appActiveStatus } = useEtc();
    const { openAlertFunc } = useAlert();

    const [photos, setPhotos] = useState([]);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [mapLoad, setMapLoad] = useState(true); // 지도 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩

    useEffect(() => {
        setPhotos([
            consts.s3Url + item?.carImageMain,
            consts.s3Url + item?.carImageFront,
            consts.s3Url + item?.carImageSide,
            consts.s3Url + item?.carImageRear
        ])
    }, [item])

    const renderItemImage = ({ item, index }) => {
        
        return (
            <Pressable onPress={() => {
                imageViewer({ index: index, list: photos })
            }}>
                <Image source={item} style={styles.photo}/>
            </Pressable>
        )
    };

    const editPop = (type) => {
        
        if(type === 'color') {
            openAlertFunc({
                component: <EditCarInfo title={lang({ id: 'enter_vehicle_color'})} placeholder={lang({ id: 'exred' })} onSubmit={(v) => submitFunc({ value: v, type })} />,
                input: 250
            })
        } else if(type === 'year') { 
            openAlertFunc({
                component: <EditCarInfo valid="number" maxLength={4} title={lang({ id: 'enter_vehicle_year'})} placeholder={`ex)${dayjs().format('YYYY')}`} onSubmit={(v) => submitFunc({ value: v, type })} />,
                input: 250
            })
        }
        
    }

    const submitFunc = async ({value, type}) => {

        setLoad(true);

		const sender = {
			type: type,
			value: value
		}

		const { data, error } = await API.post('/v2/driver/car/update', sender);

		setLoad(false);

		if (error) {
			ToastMessage(lang({ id: error?.message }, { type: 'error' }));
		} else {
			ToastMessage(lang({ id: 'saving_successfully' }));
		}

        dataFunc(true);
    }

    const changeFunc = async () => {

        const { data, error } = await API.post('/v2/auth/changeCarCheck');

        if (error) {
			ToastMessage(lang({ id: error?.message }, { type: 'error' }));
            return;
		}

        router.push(routes.myEditCar)
    }
    
    
    return (
        <View style={{ flex: 1 }}>
            {/* {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)} */}
            {/* <Text>{startIndex}{endIndex}</Text> */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: 32,
                    paddingBottom: insets?.bottom + 20,
                    gap: 15
                }}
            >
                <View style={{ gap: 26, marginBottom: 10 }}>
                    <View style={styles.box}>
                        <Text style={{...rootStyle.font(18, colors.main, fonts.semiBold)}}>{lang({ id: 'vehicle_information' })}</Text>
                    </View>
                    <View>
                        <FlatList
                            data={photos}
                            renderItem={renderItemImage}
                            contentContainerStyle={{
                                gap: 20,
                                paddingHorizontal: rootStyle.side,
                            }}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                </View>
               
                <View style={styles.list}>
                    <Text style={styles.label}>{lang({ id: 'driver_since' })}</Text>
                    <Text style={styles.content}>{dayjs(item?.createAt).format('MMMM DD, YYYY')}</Text>
                </View>

                {/* <View style={styles.list}>
                    <Text style={styles.label}>{lang({ id: 'taxi_service' })}</Text>
                    <Text style={[styles.content, { color: colors.text_popup }]}>{lang({ id: 'disabled' })}</Text>
                </View> */}
                
                <View style={styles.list}>
                    <Text style={styles.label}>{lang({ id: 'vehicle_model' })}</Text>
                    <Text style={styles.content}>{item?.carType}</Text>
                </View>

                <View style={styles.list}>
                    <Text style={styles.label}>{lang({ id: 'license_plate_number' })}</Text>
                    <Text style={styles.content}>{item?.carNumber}</Text>
                </View>

                <View style={styles.list}>
                    <Text style={styles.label}>{lang({ id: 'seating_capacity' })}</Text>
                    <Text style={styles.content}>{item?.seater}</Text>
                </View>

                <View style={styles.list}>
                    <Text style={styles.label}>{lang({ id: 'color' })}</Text>
                    <TouchableOpacity style={[rootStyle.flex, { gap: 10 }]} activeOpacity={0.7} disabled={!edit} onPress={() => editPop('color')}>
                        <Text style={[styles.content, edit && { textDecorationLine: 'underline' }]}>{item?.carColor || lang({ id: 'not_provided' })}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.list}>
                    <Text style={styles.label}>{lang({ id: 'year' })}</Text>
                    <TouchableOpacity style={[rootStyle.flex, { gap: 10 }]} activeOpacity={0.7} disabled={!edit} onPress={() => editPop('year')}>
                        <Text style={[styles.content, edit && { textDecorationLine: 'underline' }]}>{item?.carYear || lang({ id: 'not_provided' })}</Text>
                    </TouchableOpacity>
                </View>

                {/* {edit && (
                    <View style={[styles.list, { marginTop: 20 }]}>
                        <Button onPress={changeFunc}>{lang({ id: 'change_vehicle' })}</Button>
                    </View>
                )} */}

            </ScrollView>



        </View>

    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        photo: {
            width: width * 0.8,
            aspectRatio: 1/1,
            backgroundColor: colors.placeholder,
            borderRadius: 12
        },
        box: {
            paddingHorizontal: rootStyle.side
        },
        list: {
            paddingHorizontal: rootStyle.side,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        label: {
            ...rootStyle.font(16, colors.main, fonts.medium)
        },
        content: {
            ...rootStyle.font(16, colors.sub_1),
        }
    })

    return { styles }
}
