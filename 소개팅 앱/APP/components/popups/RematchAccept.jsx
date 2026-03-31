import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Platform,
    Keyboard,
    Alert
} from 'react-native';

import { router, useLocalSearchParams } from "expo-router";
import { Image, ImageBackground } from 'expo-image';
import Animated, { FadeInRight } from 'react-native-reanimated';

import Text from '@/components/Text';
import Icon from '@/components/Icon';
import Loading from '@/components/Loading';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import routes from '@/libs/routes';

import API from '@/libs/api';
import { useAlert, useConfig } from '@/libs/store';

import { ToastMessage, numFormat, useDebounce } from '@/libs/utils';
import images from '@/libs/images';

export default function Component({ item, dataFunc=()=>{} }) {

    const { styles } = useStyle();

    const { closeAlertFunc } = useAlert();

    const [load, setLoad] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (status) => {

        // 리매칭 수락/거절 API
        // closeAlertFunc();
        setLoad(true);

        const sender = {
            idx: item?.idx,
            status: status
        }
        
        const { data, error } = await API.post('/v1/rematch/select', sender);

        // setNextToken(data?.nextToken);

        setTimeout(() => {
            
            setLoad(false);
            
            if(error) {
                ToastMessage(error?.message);
                return;
            }

            closeAlertFunc();
            dataFunc();
            ToastMessage(`${status ? '수락' : '거절'} 하였습니다.`);

        }, consts.apiDelayLong)

        
    }
   

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss() }>
            <View>
                {load && ( <Loading color={colors.white} style={{ backgroundColor: colors.dim }} fixed /> )}

                <ImageBackground 
                    source={images.pop_bg}
                    style={[styles.root]}
                >
                    {/* <TouchableOpacity style={styles.top} hitSlop={10} onPress={handleClose}>
                        <Image source={images.exit} style={rootStyle.exit}/>
                    </TouchableOpacity> */}
                    
                    <View style={{ gap: 12 }}>
                        <Icon img={images.exit} imgStyle={[rootStyle.default]} style={{ alignSelf: 'flex-end' }} hitSlop={10} onPress={closeAlertFunc}/>
                        <View style={{ gap: 20, alignItems: 'center' }}>
                            <View style={{ gap: 12, alignItems: 'center' }}>
                                <Image source={item?.user?.profile ? consts.s3Url + item?.user?.profile : images.profile } style={styles.profile} />
                                <Text style={styles.label} >
                                    <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>{item?.user?.name}</Text>
                                    {'님과의 리매치를\n진행하시겠습니까?'}
                                </Text>
                            </View>

                            <Text style={styles.label} >
                                {'상대방이 리매칭 수락 시 '}
                                <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>플러팅 10개</Text>
                                {'를 받습니다.'}
                            </Text>

                            <View style={styles.comment}>
                                <Text style={styles.commentText}>{item?.message}</Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.buttonBox}>
                        <TouchableOpacity style={styles.button} onPress={() => handleSubmit(false)}>
                            <Text style={styles.buttonCencleText}>거절</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, { backgroundColor: colors.main }]} onPress={() => handleSubmit(true)}>
                            <Text style={styles.buttonOkText}>수락</Text>
                        </TouchableOpacity>
                    </View>
                </ImageBackground >
            </View>
        </TouchableWithoutFeedback>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            padding: 24,
            gap: 24
        },
        label: {
            fontSize: 16,
            lineHeight: 20,
            color: colors.dark,
            textAlign: 'center',
            letterSpacing: -0.4
        },
        title: {
            fontSize: 20,
            color: colors.dark,
            textAlign: 'center',
            letterSpacing: -0.55,
            fontFamily: fonts.semiBold
        },
        timer: {
            borderRadius: 100,
            backgroundColor: colors.white,
            paddingHorizontal: 12,
            height: 28,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4
        },
        timerText: {
            fontSize: 16,
            lineHeight: 20,
            color: colors.main,
            letterSpacing: -0.4,
            fontFamily: fonts.medium,
        },

        infoBox: {
            alignItems: 'center'
        },
        profile: {
            width: 80,
            aspectRatio: 1/1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },

        comment: {
            borderRadius: 8,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.greyD,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 11,
            paddingHorizontal: 17,
            width: '100%'
        },
        commentText: {
            fontSize: 14,
            lineHeight: 22,
            color: colors.dark,
            letterSpacing: -0.35,
            fontFamily: fonts.medium,
            textAlign: 'center'
        },

        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
        },
        button: {
            flex: 1,
            backgroundColor: colors.greyE,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'stretch',
            borderRadius: 8,
            height: 52
        },
        buttonCencleText: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.grey6,
            textAlign: 'center',
            letterSpacing: -0.4,
            fontFamily: fonts.semiBold
        },
        buttonOkText: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.white,
            textAlign: 'center',
            letterSpacing: -0.4,
            fontFamily: fonts.semiBold
        },
        error: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.red,
            textAlign: 'center',
        },

    })
  
    return { styles }
}
