import { useEffect } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Loading from '@/components/Loading';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';


const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Component({
    title,
    type = '1',
    disabled = false,
    load = false,
    bottom = false,
    placeHolder = "",
    onPress = () => { },
    onPressRight = () => { }
}) {

    const insets = useSafeAreaInsets();

    const backgroundColor = useSharedValue(styles.backgroundColor);
    const textColor = useSharedValue(styles.text.color);
    const textPlaceColor = useSharedValue(styles.text_playholder.color);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(backgroundColor.value, { duration: 300 }),
        };
    });

    /**
  map_fin_on
    map_fin_off
    map_fin_fill_on
    map_fin_fill_off
     */
    return (
        <View style={{ width: "100%" }}>
            <Pressable style={styles.contain} onPress={onPress}>
                <Image
                    source={type === 1 ? images[`map_fin_${title ? "on" : "off"}`] : images[`map_fin_fill_${title ? "on" : "off"}`]}
                    style={rootStyle.default}
                />
                <Text style={title ? styles.text : styles.text_playholder}>{title ? title : placeHolder}</Text>
                {title && <TouchableOpacity onPress={onPressRight}>
                    <Image source={images.reset} style={rootStyle.size_24 || rootStyle.default} />
                </TouchableOpacity>}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    contain: {
        display: "flex",
        width: '100%',
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.sub_1,
        backgroundColor: colors.white,
        paddingVertical: 10,
        paddingHorizontal: 14,
        gap: 9
    },
    contain_active: {
        display: "flex",
        width: '100%',
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.sub_1,
        backgroundColor: colors.white,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    text_playholder: {
        // color: colors.taseta_sub_2,
        flex: 1,
        color: colors.sub_1,
        textAlign: "left",
        fontFamily: fonts.semiBold,
        fontSize: 18,
    },
    text: {
        // color: colors.taseta_sub_2,
        flex: 1,
        color: colors.main,
        textAlign: "left",
        fontFamily: fonts.semiBold,
        fontSize: 18,
    }
});
