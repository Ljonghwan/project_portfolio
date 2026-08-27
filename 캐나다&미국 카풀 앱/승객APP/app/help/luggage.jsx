import { useEffect, useState, useRef } from 'react';
import { ScrollView, View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';
import lang from '@/libs/lang';

import { ToastMessage, regPhone } from '@/libs/utils';

export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const { idx, title, route } = useLocalSearchParams();

    const [ item, setItem ] = useState(null);

    return (
        <ScrollView style={styles.root} contentContainerStyle={{ gap: 15 }}>
            <Text style={styles.title}>{lang({ id: 'luggage_size_guide' })}</Text>

            <View style={{ gap: 26 }}>
                <Text style={styles.comment}>{`Small (S)\n• Height: 21-22 in (53.3-55.9 cm)\n• Width: 14-16 in (35.6-40.6 cm)\n• Depth: 9-10 in (22.9-25.4 cm)\n• Example: Standard carry-on size is approx. 22 x 14 x 9 in (56 x 36 x 23 cm)`}</Text>
                <Text style={styles.comment}>{`Medium (M)\n• Height: 24-26 in (61-66 cm)\n• Width: 16-18 in (40.6-45.7 cm)• Depth: 10-12 in (25.4-30.5 cm)`}</Text>
                <Text style={styles.comment}>{`Large (L)\n• Height: 28-30 in (71-76 cm) or larger\n• Width: 18-20 in (45.7-50.8 cm)\n• Depth: 12-14 in (30.5-35.6 cm)`}</Text>
            </View>
        </ScrollView>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.white,
            paddingHorizontal: rootStyle.side,
            paddingTop: 14
        },
        title: {
            color: colors.main,
            fontSize: 20,
            lineHeight: 24,
            fontFamily: fonts.semiBold,
            letterSpacing: -0.4,
        },
        comment: {
            color: colors.main,
            fontSize: 18,
            lineHeight: 26,
            fontFamily: fonts.medium,
            letterSpacing: -0.4,
        }
    })

    return { styles }
}