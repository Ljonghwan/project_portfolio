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

export default function Page({ start=null, end=null, way=[] }) {

    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();

    const [boxHeight, setBoxHeight] = useState(0);

    const onLayout = (e) => {
        setBoxHeight(e.nativeEvent.layout.height)
	};

    return (
        <View style={styles.bottom}>
            <View style={{ gap: 25 }} onLayout={onLayout}>
                <View style={[styles.bar, { height: boxHeight - 30 }]} />

                <View style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
                    <View style={[rootStyle.default19]}>
                        <Image source={images.start_point} style={{ width: '100%', height: '100%'}}/>
                    </View>
                    <Text numberOfLines={2} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium)}}>{start}</Text>
                </View>
                {way?.map((x, i) => {
                    return (
                        <View key={i} style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
                            <View style={[rootStyle.default19, rootStyle.flex, { backgroundColor: colors.taseta, borderRadius: 1000 }]}>
                                <Text style={{...rootStyle.font(14, colors.white, fonts.semiBold), lineHeight: 19 }}>{i + 1}</Text>
                            </View>
                            <Text numberOfLines={2} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium)}}>{x?.name}</Text>
                        </View>
                    )
                })}
                <View style={[rootStyle.flex, { gap: 16, justifyContent: 'flex-start' }]}>
                    <View style={[rootStyle.default19]}>
                        <Image source={images.end_point} style={{ width: '100%', height: '100%'}}/>
                    </View>
                    <Text numberOfLines={2} style={{ flex: 1, ...rootStyle.font(18, colors.main, fonts.medium)}}>{end}</Text>
                </View>
            </View>
        </View>
                
    )
}


const useStyle = () => {
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
       
        bottom: {
        },
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