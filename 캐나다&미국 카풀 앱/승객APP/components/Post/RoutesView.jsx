import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Pressable } from 'react-native';
import WebView from 'react-native-webview';
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Text from '@/components/Text';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, hpHypen, numDoler } from '@/libs/utils';

import { useUser, useCall, useAlert, useLoader, usePhotoPopup } from '@/libs/store';

export default function Page({ style, textStyle, way=[] }) {

    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { token, mbData, login, logout, reload } = useUser();

    const [boxHeight, setBoxHeight] = useState(0);

    const onLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
	};

    return (
        <View style={[{ gap: 25 }, style]} onLayout={onLayout}>
            <View style={[styles.bar, { height: boxHeight - 30 }]} />
            {way?.map((x, i) => {
                return (
                    <View key={i} style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
                        <View style={[rootStyle.default19, rootStyle.flex, { backgroundColor: colors.taseta, borderRadius: 1000 }]}>
                            {i === 0 ? (
                                <Image source={images.start_point} style={{ width: '100%', height: '100%'}}/>
                            ) : i === way?.length - 1 ? (
                                <Image source={images.end_point} style={{ width: '100%', height: '100%'}}/>
                            ) : (
                                <Text style={{...rootStyle.font(14, colors.white, fonts.semiBold), lineHeight: 19 }}>{i}</Text>
                            )}
                        </View>
                        <View style={[rootStyle.flex, { flex: 1, gap: 10 }]}>
                            <Text numberOfLines={2} style={[{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium)}, textStyle]}>{x?.name}</Text>
                            {x?.pay ? <Text style={{ ...rootStyle.font(14, colors.main, fonts.medium)}}>{numDoler(x?.pay)}</Text> : <></>}
                        </View>
                    </View>
                )
            })}
        </View>
                
    )
}


const useStyle = () => {
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
       
        bar: {
            position: 'absolute',
            left: 19 / 2 - 1,
            top: 15,
            height:'100%',
            borderRightWidth: 1,
            borderRightColor: colors.taseta,
            borderStyle: Platform.OS === 'ios' ? 'solid' : 'dashed'
        },


    })

    return { styles }
}