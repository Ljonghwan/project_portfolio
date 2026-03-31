import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
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

export default function Component({
    name,
    value,
    setValue=()=>{},
    target
}) {

    const { configOptions } = useConfig();

    useEffect(() => {
        console.log('configOptions', configOptions);

    }, [configOptions])

    const renderItem = ({ item, index }) => {
        return (
            <ListItem delay={index * 20} active={value === item} title={item} onPress={() => setValue({ value: item, name: name })}/>
        );
    };
    
    return (
        <View style={styles.root}>

            <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} entering={FadeInLeft}>
                <Text style={styles.title}>페이지 내용입니다</Text>
            </Animated.View>
{/* 
            <View style={[rootStyle.flex, { flex: 1 }]}>

                <FlatList
                    indicatorStyle={'black'}
                    data={configOptions?.bodyOptions}
                    renderItem={renderItem}
                    numColumns={3}
                    style={styles.scroll} 
                    columnWrapperStyle={{ gap: 4 }}
                    contentContainerStyle={{ paddingBottom: 20, rowGap: 4 }}
                />
              
            </View> */}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    title: {
        color: colors.dark,
        fontSize: 20,
        lineHeight: 24,
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
