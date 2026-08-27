import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    Pressable,
    TouchableOpacity,
    TextInput,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator,
    Keyboard,
    Platform
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { FadeInUp, FadeOutUp, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Application from 'expo-application';
import AwesomeGallery from 'react-native-awesome-gallery';

import { ToastMessage, regNick } from '@/libs/utils';

// component
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Icon from '@/components/Icon';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';

import { useUser } from '@/libs/store';

import API from '@/libs/api';


const renderItem = ({
    item,
    setImageDimensions,
}) => {
    
    const { width, height } = useSafeAreaFrame();

    return (
        <Image
            source={item}
            style={[StyleSheet.absoluteFillObject, {  }]}
            contentFit="contain"
            onLoad={(e) => {
                const { width, height } = e.source;
                setImageDimensions({ width, height });
            }}
        />
    );
};

export default function Page({ }) {

    const { index, list } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const { mbData, reload } = useUser();

    const gallery = useRef(null);

    const [photos, setPhotos] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);

    const [mounted, setMounted] = useState(false);
    const [infoVisible, setInfoVisible] = useState(true);

    useEffect(() => {
        setMounted(true);
        StatusBar.setBarStyle('light-content', true);

        return () => {
            StatusBar.setBarStyle('dark-content', true);
        }
    }, []);

  
    useEffect(() => {
        console.log('list', list);

        setPhotos(list?.split(",")?.map(x => consts.s3Url + x));
        // setImages(list?.split(",")?.map(x => 'https://picsum.photos/500/600'));
       
    }, [index, list])

    const onTap = () => {
        setInfoVisible(!infoVisible);
    };

    const header = {
        title: '앱버전',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <View style={styles.container}>
            {infoVisible && (
                <Animated.View
                    entering={mounted ? FadeInUp.duration(250) : undefined}
                    style={[
                        styles.toolbar,
                        {
                            height: insets?.top + 60,
                            paddingTop: insets?.top,
                        },
                    ]}
                >
                    <Pressable style={styles.textContainer} hitSlop={10} onPress={() => router.back()}>
                        <Image source={images.exit_grey} style={rootStyle.default} />
                    </Pressable>
                </Animated.View>
            )}

            {photos?.length > 0 && (
                <AwesomeGallery
                    ref={gallery}
                    data={photos}
                    renderItem={renderItem}
                    style={{ backgroundColor: colors.black, width }}
                    containerDimensions={{ width, height }}
                    keyExtractor={(item, index) => index}
                    initialIndex={index*1}
                    doubleTapInterval={150}
                    onSwipeToClose={() => router.back()}
                    onTap={onTap}
                    loop
                    onIndexChange={(newIndex) => {
                        setActiveIndex(newIndex)
                    }}
                    onScaleEnd={(scale) => {
                        if (scale < 0.8) {
                            router.back();
                        }
                    }}
                    />
            )}
            
            {infoVisible && (
                <Animated.View
                    entering={mounted ? FadeInDown.duration(250) : undefined}
                    style={[
                        styles.toolbar,
                        styles.bottomToolBar,
                        {
                            height: insets?.bottom + 100,
                            paddingBottom: insets?.bottom,
                        },
                    ]}
                >
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{activeIndex+1}/{photos?.length}</Text>
                    </View>
                </Animated.View>
            )}
        </View>

    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        container: {
            flex: 1,
        },
        toolbar: {
            position: 'absolute',
            width: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1,
        },
        textContainer: {
            width: 50,
            height: 50,
            alignSelf: 'flex-end',
            alignItems: 'center',
            justifyContent: 'center',
        },
        bottomToolBar: {
            bottom: 0,
        },
        
        footer: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 12
        },
        footerText: {
            fontSize: 16,
            color: colors.white,
            fontFamily: fonts.semiBold,
            letterSpacing: 1.5
        }
    })

    return { styles }
}
