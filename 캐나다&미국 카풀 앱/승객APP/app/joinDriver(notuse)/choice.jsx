import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform } from 'react-native';

import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect, router, usePathname, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Accordion from '@/components/Accordion';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import consts from '@/libs/consts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';

import { ToastMessage, regPhone } from '@/libs/utils';
import { useUser, useDriverData } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Page() {

    const { styles } = useStyle();
    
    const { mbData } = useUser();
    const { setDriverData } = useDriverData();

    const [ level, setLevel ] = useState(null);

    const [ load, setLoad ] = useState(false);

    const submitFunc = () => {
        
        setDriverData({ key: 'driverType', value: level });

        router.push(routes.joinDriverInfo);
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <View style={styles.root}>
                <View style={{ gap: 11 }}>
                    <Text style={styles.title}>{lang({ id: 'start_as_driver' })}{level}</Text>
                    <Text style={styles.subTitle}>{lang({ id: 'practice_carbon_neut' })}</Text>
                </View>

                <View style={{ flex: 1, gap: 19 }}>
                    <Accordion 
                        list={consts.modeOptions.map(x => ({...x, title: lang({ id: x.title }), message: lang({ id: x.message }) }) )}
                        value={level}
                        setValue={setLevel}
                    />
                </View>
                
            </View>

            <View style={styles.bottom}>
                <Button disabled={!level} style={{ width: 120 }} onPress={submitFunc}>{lang({ id: 'continue' })}</Button>
            </View>
        </View>
    )
}


const useStyle = () => {

	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		root: {
			flex: 1,
            paddingHorizontal: rootStyle.side,
            paddingTop: 20,
            gap: 30
		},
        title: {
            color: colors.main,
            fontSize: 30,
            fontFamily: fonts.extraBold
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
            letterSpacing: -0.64,
        },
        checkAll: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.sub_1,
            gap: 12
        },
        checkAllText: {
            fontSize: 20,
            fontFamily: fonts.extraBold,
            color: colors.main
        },
        bottom: {
            paddingHorizontal: rootStyle.side,
            paddingBottom: insets?.bottom + 20,
            alignItems: 'flex-end'
        }
	})

  	return { styles }
}