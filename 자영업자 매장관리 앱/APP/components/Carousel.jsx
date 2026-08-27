import React, { useEffect, useState, useRef } from 'react';
import {
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
    useWindowDimensions,
    FlatList
} from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import Icon from '@/components/Icon';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

export default function Component({
    style,
    listStyle,
    containerStyle,
    list = [],
    renderItem = () => { },
    pagination = true,
    paginationType = 'dot',
    pagingEnabled=true
}) {

    const { styles } = useStyle();
    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();

    const scRef = useRef(null);

    const [currentIndex, setCurrentIndex] = useState(0);


    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <View style={[{}, style]}  >
            <FlatList
                ref={scRef}
                data={list}
                renderItem={renderItem}
                keyExtractor={(item, index) => index}
                horizontal
                pagingEnabled={pagingEnabled}
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{
                    itemVisiblePercentThreshold: 50,
                }}
                bounces={true}
                style={[{ backgroundColor: colors.placeholder }, listStyle]}
                contentContainerStyle={containerStyle}
                
            />

            {pagination && (
                paginationType === 'page' ? (
                    <View style={styles.indexPage}>
                        <Text style={{...rootStyle.font(12, colors.white)}}>{currentIndex+1}/{list?.length}</Text>
                    </View>
                ) : (
                    <View style={styles.paginationContainer}>
                        <View style={styles.pagination}>
                            {list?.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        currentIndex === index && styles.activeDot,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                )
            )}

        </View>
    );
}


const useStyle = () => {

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({

        paginationContainer: {
            width: '100%',
            alignItems: 'center',
        },
        pagination: {
            flexDirection: 'row',
            gap: 8,
        },
        dot: {
            width: 9,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.placeholder,
        },
        activeDot: {
            backgroundColor: colors.onboardingOrange,
        },

        indexPage: {
            position: 'absolute', 
            top: 12, 
            right: 12, 
            backgroundColor: 'rgba(49, 49, 49, 0.72)',
            height: 24,
            alignItems: 'center', 
            justifyContent: 'center',
            paddingHorizontal: 8,
            borderRadius: 1000
        }
    });


    return { styles }
}

