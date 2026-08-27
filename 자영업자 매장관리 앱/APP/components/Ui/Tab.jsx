import React, { useRef } from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
    Pressable,
    ScrollView,
    FlatList,
    TouchableOpacity
} from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';
import fonts from '@/libs/fonts';

export default function Component({
    type = '',
    style,
    tabs,
    active,
    setActive = () => { },
    scroll = true,
}) {

    const { styles } = useStyle();

    const scrollViewRef = useRef(null);
    const tabRefs = useRef([]);

    const handleTabPress = (key, index) => {
        setActive(key);

        console.log(key, index);

        // 탭의 위치 측정
        tabRefs.current[index]?.measureLayout(
            scrollViewRef.current,
            (x, y, width, height) => {
                // 탭을 중앙에 배치하도록 스크롤
                console.log('x - (width / 2),', x - (width / 2));
                scrollViewRef.current?.scrollTo({
                    x: x - (width / 2),
                    animated: true
                });
            },
            () => { }
        );
    };

    return (
        type ? (
            <View style={{  }}>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles?.[`tabContainer_${type}`], style]}
                    scrollEnabled={scroll}
                >
                    <View style={styles?.[`tabUnderline_${type}`]} />
                    {tabs?.map((x, i) => {
                        return (
                            <TouchableOpacity key={i} ref={(ref) => (tabRefs.current[i] = ref)} style={[styles?.[`tab_${type}`], x?.key === active && styles?.[`active_${type}`]]} activeOpacity={0.7} onPress={() => handleTabPress(x?.key, i)}>
                                <Text style={[styles?.[`tabTextInactive_${type}`], x?.key === active && styles?.[`tabTextActive_${type}`]]}>{x?.title}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>
        ) : (
            <View style={[styles.tabContainer, style]}>
                <View style={styles.tabUnderline} />
                {tabs?.map((x, i) => {
                    return (
                        <TouchableOpacity key={i} style={[styles.tab, x?.key === active && styles.active]} activeOpacity={0.7} onPress={() => setActive(x?.key)}>
                            <Text style={[styles.tabTextInactive, x?.key === active && styles.tabTextActive]}>{x?.title}</Text>
                        </TouchableOpacity>
                    )
                })}
            </View>
        )
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        tabContainer: {
            flexDirection: 'row',
            position: 'relative',
        },
        tabUnderline: {
            position: 'absolute',
            bottom: 0,
            left: 2,
            right: 2,
            height: 1,
            backgroundColor: colors.border,
        },
        tab: {
            flex: 1,
            paddingVertical: 11,
            alignItems: 'center',
        },
        active: {
            borderBottomWidth: 2,
            borderBottomColor: colors.primary
        },
        tabTextActive: {
            fontSize: 14,
            fontFamily: fonts.semiBold,
            color: colors.primary,
        },
        tabTextInactive: {
            fontSize: 14,
            fontFamily: fonts.medium,
            color: colors.text7A7F86,
        },



        tabContainer_1: {
            flexDirection: 'row',
            alignItems: 'center',
            position: 'relative',
            gap: 10,
            paddingHorizontal: 28,
        },
        tabUnderline_1: {
            position: 'absolute',
            bottom: 0,
            left: 2,
            right: 2,
            height: 1,
            backgroundColor: colors.fafafa,
        },
        tab_1: {
            paddingVertical: 16,
            paddingHorizontal: 8,
            alignItems: 'center',
            height: 52
        },
        active_1: {
            borderBottomWidth: 2,
            borderBottomColor: colors.text2B2B2B,
        },
        tabTextActive_1: {
            fontSize: 15,
            fontFamily: fonts.semiBold,
            color: colors.text2B2B2B,
        },
        tabTextInactive_1: {
            fontSize: 15,
            fontFamily: fonts.semiBold,
            color: colors.text757575,
        },

        tabContainer_2: {
            flexDirection: 'row',
            alignItems: 'center',
            position: 'relative',
            gap: 10,
            paddingHorizontal: 20
        },
        tabUnderline_2: {
            position: 'absolute',
            bottom: 0,
            left: 2,
            right: 2,
            height: 1,
            backgroundColor: colors.fafafa,
        },
        tab_2: {
            paddingVertical: 16,
            paddingHorizontal: 8,
            alignItems: 'center',
            height: 52
        },
        active_2: {
            borderBottomWidth: 2,
            borderBottomColor: colors.primary,
        },
        tabTextActive_2: {
            fontSize: 15,
            fontFamily: fonts.semiBold,
            color: colors.primary,
        },
        tabTextInactive_2: {
            fontSize: 15,
            fontFamily: fonts.semiBold,
            color: colors.text757575,
        },




        tabContainer_3: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#EBEBF599',
            borderRadius: 24,
            padding: 2
        },
        tab_3: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            height: 44,
            borderRadius: 24
        },
        active_3: {
            backgroundColor: colors.primary,
        },
        tabTextActive_3: {
            fontSize: 14,
            fontFamily: fonts.regular,
            color: colors.white,
        },
        tabTextInactive_3: {
            fontSize: 14,
            fontFamily: fonts.regular,
            color: colors.header,
        },

    })

    return { styles }
}
