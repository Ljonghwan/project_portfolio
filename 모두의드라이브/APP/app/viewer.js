import { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeOutUp, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import AwesomeGallery from 'react-native-awesome-gallery';
import { COLORS, FONTS, FONT_SIZE } from '../src/constants/config';

const renderItem = ({ item, setImageDimensions }) => (
    <Image
        source={item}
        style={StyleSheet.absoluteFillObject}
        contentFit="contain"
        onLoad={(e) => {
            const { width, height } = e.source;
            setImageDimensions({ width, height });
        }}
    />
);

export default function ViewerScreen() {
    const { index, list } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const gallery = useRef(null);

    const [photos, setPhotos] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [infoVisible, setInfoVisible] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (list) {
            setPhotos(list.split(',').filter(Boolean));
        }
    }, [list]);

    const onTap = useCallback(() => {
        setInfoVisible((v) => !v);
    }, []);

    const handleClose = useCallback(() => {
        router.back();
    }, [router]);

    if (!photos.length) return null;

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {infoVisible && (
                <Animated.View
                    key={`top-${mounted}`}
                    entering={FadeInUp.duration(250)}
                    exiting={FadeOutUp.duration(250)}
                    style={[
                        styles.toolbar,
                        { height: insets.top + 56, paddingTop: insets.top },
                    ]}
                >
                    <Pressable
                        testID="viewer-close-btn"
                        style={styles.closeBtn}
                        hitSlop={10}
                        onPress={handleClose}
                    >
                        <Image
                            source={require('../assets/icons/close.svg')}
                            style={{ width: 24, height: 24 }}
                            tintColor={COLORS.white}
                        />
                    </Pressable>
                </Animated.View>
            )}

            <AwesomeGallery
                ref={gallery}
                data={photos}
                renderItem={renderItem}
                style={{ backgroundColor: COLORS.black }}
                keyExtractor={(item, i) => String(i)}
                initialIndex={Number(index) || 0}
                doubleTapInterval={150}
                onSwipeToClose={handleClose}
                onTap={onTap}
                loop
                onIndexChange={(newIndex) => setActiveIndex(newIndex)}
            />

            {infoVisible && (
                <Animated.View
                    key={`bottom-${mounted}`}
                    entering={FadeInDown.duration(250)}
                    exiting={FadeOutDown.duration(250)}
                    style={[
                        styles.toolbar,
                        styles.bottomToolbar,
                        { height: insets.bottom + 60, paddingBottom: insets.bottom },
                    ]}
                >
                    <View style={styles.footer}>
                        <Text style={styles.footerText} allowFontScaling={false}>
                            {activeIndex + 1}/{photos.length}
                        </Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.black,
    },
    toolbar: {
        position: 'absolute',
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1,
    },
    closeBtn: {
        width: 48,
        height: 48,
        alignSelf: 'flex-end',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    bottomToolbar: {
        bottom: 0,
    },
    footer: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 12,
    },
    footerText: {
        fontSize: FONT_SIZE.h4,
        color: COLORS.white,
        fontFamily: FONTS.semiBold,
        letterSpacing: 1.5,
    },
});
