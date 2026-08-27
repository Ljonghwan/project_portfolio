import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInLeft} from 'react-native-reanimated';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ListItem from '@/components/ListItem';

import { useConfig } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import dummy from '@/libs/dummy';
import rootStyle from '@/libs/rootStyle';
import { useBackHandler, ToastMessage } from '@/libs/utils';

export default function Component({
    name,
    value=[],
    setValue=()=>{},
    max,
    target
}) {

    const { configOptions } = useConfig();
    const { width, height } = useWindowDimensions();

    useEffect(() => {


    }, [])

    const renderItem = ({ item, index }) => {
        return (
            <ListItem delay={index * 20} active={value?.includes(item)} title={item} onPress={() => onPress(item)} />
        );
    };
    
    const onPress = (v) => {

        if(value?.includes(v)) {
            setValue({ value: value?.filter(item => item !== v), name: name })
        } else {
            if(value?.length >= max) return;

            setValue({ value: [...value || [], v], name: name })
        }
        
    }

    return (
        <View style={styles.root}>

            <Animated.View entering={FadeInLeft} style={{ gap: 5 }}>
                <Text style={styles.title}>{target ? '원하는 이성은 어떤 데이트를\n선호했으면 좋겠나요?' : '회원님은 어떤 데이트를 선호하나요?'}</Text>
                <Text style={styles.subTitle}>아래 각 항목 중 3개씩 선택해 주세요.</Text>
            </Animated.View>

            <View style={[rootStyle.flex, { flex: 1 }]}>

                <FlatList
                    indicatorStyle={'black'}
                    data={configOptions?.preferredDateOptions}
                    renderItem={renderItem}
                    numColumns={3}
                    style={styles.scroll} 
                    columnWrapperStyle={{ gap: 4 }}
                    contentContainerStyle={{ paddingBottom: 20, rowGap: 4 }}
                />
              
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        gap: 40,
    },
    title: {
        color: colors.dark,
        fontSize: 24,
        lineHeight: 28,
        fontFamily: fonts.bold,
        letterSpacing: -1.2,
        textAlign: 'center'
    },
    subTitle: {
        color: colors.grey6,
        fontSize: 16,
        lineHeight: 20,
        textAlign: 'center',
        letterSpacing: -0.4,
        marginBottom: -20
    },
    span: {
        color: colors.dark,
        fontFamily: fonts.semiBold,
        fontSize: 20,
        lineHeight: 24,
    },
    scroll: {
        flex: 1, 
        height: '100%',
    },
    scrollBorder: {
        borderRadius: 8,
        borderColor: colors.primary,
        borderWidth: 1,
        overflow: 'hidden',
         flex: 1,
         height: '100%'
    },
    item: {
        height: 56,
        borderRadius: 8,
        borderColor: colors.greyE,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    itemActive: {
        backgroundColor: colors.white,
        borderColor: colors.primary,
        borderWidth: 1,

        shadowColor: colors.primary, 
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1, 
        shadowRadius: 12, 
        // Android 그림자 속성
        elevation: 5, // Android에서 그림자 높이 (적절히 조정)
    },
    itemText: {
        color: colors.grey9,
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 24,
    },
    sigungu: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 56,
    },
    sigunguActive: {
        backgroundColor: colors.primaryLight
    },
});
