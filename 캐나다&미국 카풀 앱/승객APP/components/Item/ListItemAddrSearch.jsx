import { StyleSheet, TouchableOpacity, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from 'expo-image';

import Text from '@/components/Text';

import rootStyle from "@/libs/rootStyle";
import images from "@/libs/images";
import colors from "@/libs/colors";
import fonts from "@/libs/fonts";

import { formatDistance } from "@/libs/utils";

export default function Component({
    item = {},
    onPress=()=>{}
}) {
    const { styles } = useStyle();

    return (
        <TouchableOpacity style={styles.contain} onPress={onPress}>
            <View style={styles.textBox}>
                <Text style={styles.title} numberOfLines={1}>{item?.name}</Text>
                <Text style={styles.v}>{item?.distance ? formatDistance(item?.distance) : ''}</Text>
            </View>
            <Text style={styles.subTitle} numberOfLines={2}>{item?.address}</Text>
        </TouchableOpacity >
    )

}

const useStyle = () => {
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        contain: {
            gap: 5,
            paddingVertical: 20,
            borderTopWidth: 1,
            borderTopColor: colors.sub_1,
        },
        textBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6.5
        },
        title: {
            flexShrink: 1,
            fontSize: 18,
            color: colors.main,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.36
        },
        distance: {
            fontSize: 16,
            color: colors.main,
            fontFamily: fonts.medium,
            letterSpacing: -0.32
        },
        subTitle: {
            fontSize: 18,
            color: colors.sub_1,
            fontFamily: fonts.medium,
            letterSpacing: -0.36
        }
    })
    return { styles }
}