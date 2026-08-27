import { StyleSheet, TouchableOpacity, View } from "react-native";
import Text from '@/components/Text';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import rootStyle from "@/libs/rootStyle";
import { Image } from 'expo-image';
import images from "@/libs/images";
import colors from "@/libs/colors";
import fonts from "@/libs/fonts";

export default function Component({
    data = {},
    onPress=()=>{},
    onDelete=()=>{}
}) {
    const { styles } = useStyle();

    return (
        <TouchableOpacity style={styles.contain} onPress={() => onPress(data)}>
            <Image source={images.timer_reset} style={rootStyle.size_24} />
            <View style={styles.textBox}>
                <Text style={rootStyle.font(18, colors.main, fonts.semiBold)}>{data?.name}</Text>
                <Text
                    numberOfLines={2}
                    style={rootStyle.font(18, colors.sub_1, fonts.semiBold)}
                >
                    {data?.address}
                </Text>
            </View>
            <TouchableOpacity onPress={() => { onDelete(data?.idx) }}>
                <Image source={images.dash} style={rootStyle.size_24} />
            </TouchableOpacity>
        </TouchableOpacity >
    )
}

const useStyle = () => {
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        contain: {
            display: "flex",
            flexDirection: "row",
            gap: 12,
            paddingVertical: 26,
            borderTopWidth: 1,
            borderTopColor: colors.sub_1,
        },
        textBox: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6.5
        },
    })
    return { styles }
}