import { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ListItem from '@/components/ListItem';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import dummy from '@/libs/dummy';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import API from '@/libs/api';

import { useConfig } from '@/libs/store';

export default function Component({
    name,
    value="",
    setValue=()=>{},
    target
}) {

    const { configOptions } = useConfig();

    const insets = useSafeAreaInsets();

    const renderItem = ({ item, index }) => {
        return (
            <ListItem style={{ maxWidth: '100%' }} delay={index * 50} active={value === item?.title} title={item?.title} onPress={() => setValue({ value: item?.title, name: name })}/>
        );
    };

    return (
        <View 
            style={styles.root}
        >
            <Animated.View entering={FadeIn}>
                <Text style={styles.title}>연인에게 나는 이런 스타일이에요!</Text>
            </Animated.View>
            
            <View style={[{ flex: 1 }]}>
                <Animated.View key={value || 'default'} entering={FadeIn} style={{ marginBottom: 0 }}>
                    <Image source={consts.s3Url + (configOptions?.myStyleOptions?.find(v => v?.title === value)?.icon || configOptions?.myStyleOptions?.[0]?.icon)} style={styles.styleImage} />
                </Animated.View>

                <FlatList
                    data={configOptions?.myStyleOptions}
                    renderItem={renderItem}
                    numColumns={1}
                    style={[styles.scroll, { }]} 
                    contentContainerStyle={{ 
                        paddingTop: 20, 
                        paddingBottom: insets.bottom + 100, 
                        gap: 4 
                    }} 
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingHorizontal: rootStyle.side + 10,
        paddingTop: 30,
        gap: 10
    },
    title: {
        color: colors.dark,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.semiBold,
        letterSpacing: -0.45,
    },
    scroll: {
        flex: 1, 
    },
    styleImage: {
        width: 200,
        aspectRatio: 1,
        alignSelf: 'center',
    }

    
});
