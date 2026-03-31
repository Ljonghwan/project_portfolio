import React, { useEffect } from 'react';
import { 
  View, 
  Platform, 
  StyleSheet, 
  TouchableOpacity, 
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import { Tabs, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import Text from '@/components/Text';
import { AnimatedBackground } from '@/components/chatTheme/AnimatedColorComponents';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import chatStyle from '@/libs/chatStyle';

import consts from '@/libs/consts';

import { useUser, useEtc } from '@/libs/store';
import { getBadgeCount } from '@/libs/utils';

function MyTabBar({route, state, descriptors, navigation}) {

    const { width } = useSafeAreaFrame();
    const { styles } = useStyle();

    const { mbData, badgeCount, reload } = useUser();
    const { goTopFunc } = useEtc();

    const tabCount = state.routes.length;
    const tabWidth = width / tabCount;
    
    // Reanimated shared value
    const translateX = useSharedValue(0);

    // 탭 변경 시 애니메이션 실행
    useEffect(() => {
        translateX.value = withSpring(state.index * tabWidth, {
            damping: 15,
            stiffness: 150,
            mass: 0.5,
        });
        
        // timing 애니메이션 원하면 이걸로
        // translateX.value = withTiming(state.index * tabWidth, {
        //     duration: 250,
        //     easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        // });
    }, [state.index, tabWidth]);

    // Animated style
    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    return (
        <View style={styles.tabbar}>
            
            {/* 움직이는 인디케이터 */}
            <Animated.View 
                style={[
                    styles.indicator,
                    { width: tabWidth },
                    indicatorStyle,
                ]}
            >
                <AnimatedBackground bg={chatStyle?.[`chat_season_${state.index + 1}`]?.tabColor} style={styles.indicatorBar} />
            </Animated.View>

            <View style={styles.tabContainer}>
                {state.routes.map((route, index) => {

                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);	

                        if(isFocused) {
                            goTopFunc();
                            return;
                        }

                        navigation.navigate(route.name);
                    };

                    return (
                        <TouchableOpacity
                            onPress={onPress}
                            style={styles.item}
                            key={index}
                            activeOpacity={0.7}
                        >
                            <View style={styles.itemContainer}>
                                <Image 
                                    source={images?.[`season_menu_${index+1}_${isFocused ? 'on' : 'off'}`]} 
                                    style={rootStyle.default} 
                                    transition={200}
                                />	
                                <Text style={[styles.itemText, isFocused && { color: chatStyle?.[`chat_season_${index + 1}`]?.tabColor }]}>
                                    {options.title}
                                </Text>

                                {(route.name === 'chat' && badgeCount > 0) && (
                                    <View style={styles.count}>
                                        <Text style={styles.countText}>{badgeCount}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}


export default function TabLayout() {

    const { roomIdx } = useLocalSearchParams();

    return (
        <Tabs
            backBehavior="none" 
            screenOptions={{ 
                headerShown: false,
                animation: Platform.OS === 'ios' ? 'shift' : 'none',
                lazy: true,
            }}
            tabBar={props => <MyTabBar {...props} />}
        >
            <Tabs.Screen
                name={'spring'}
                options={{ title: '봄' }}
                initialParams={{ tabs: true, roomIdx: roomIdx }} 
            />
            <Tabs.Screen
                name={'summer'}
                options={{ title: '여름' }}
                initialParams={{ tabs: true, roomIdx: roomIdx }} 
            /> 
            <Tabs.Screen
                name={'autumn'}
                options={{ title: '가을' }}
                initialParams={{ tabs: true, roomIdx: roomIdx }} 
            />
            <Tabs.Screen
                name={'winter'}
                options={{ title: '겨울' }}
                initialParams={{ tabs: true, roomIdx: roomIdx }} 
            />
            <Tabs.Screen
                name={'all'}
                options={{ title: '사계 리포트' }}
                initialParams={{ tabs: true, roomIdx: roomIdx }} 
            />
        </Tabs>
    );
}
  
const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    
    const styles = StyleSheet.create({
        
        tabbar: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            backgroundColor: colors.white,
            paddingBottom: insets?.bottom,
            elevation: 10,
            shadowColor: colors.dark,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
        },
        tabContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            overflow: 'hidden',
            zIndex: 2,
            height: rootStyle.bottomTabs.height,
        },
        
        // 인디케이터 스타일
        indicator: {
            position: 'absolute',
            top: 0,
            left: 0,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
        },
        indicatorBar: {
            width: '100%',
            height: 3,
            backgroundColor: "#8D93FF",
            borderRadius: 2,
        },

        item: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        itemContainer: {
            width: '100%',
            height: '100%',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7
        },
        itemText: {
            fontSize: 12,
            color: '#A4A5B4',
            fontFamily: fonts.regular,
            textAlign: 'center',
        },
        count: {
            minWidth: 16,
            height: 16,
            paddingHorizontal: 4,
            backgroundColor: colors.red,
            borderRadius: 100,
            position: 'absolute',
            top: 5,
            left: '55%',
            alignItems: 'center',
            justifyContent: 'center',
        },
        countText: {
            fontFamily: fonts.bold,
            fontSize: 10,
            lineHeight: 16,
            color: colors.white,
        },
        blur: {
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: -40,
            zIndex: 1,
        },
    })
  
    return { styles }
}