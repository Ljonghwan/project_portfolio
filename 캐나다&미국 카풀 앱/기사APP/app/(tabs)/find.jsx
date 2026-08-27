import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    View,
    ScrollView,
    StatusBar,
    Alert,
    useWindowDimensions,
    ActivityIndicator,
    Platform
} from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { TabView, TabBar } from 'react-native-tab-view';

import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';
import Lock from '@/components/Lock';


import FindSearchList from '@/componentsPage/FindSearchList';
import FindRequestList from '@/componentsPage/FindRequestList';
import FindMyPostList from '@/componentsPage/FindMyPostList';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import lang from '@/libs/lang';
import consts from '@/libs/consts';
import images from '@/libs/images';

import { ToastMessage } from '@/libs/utils';

import API from '@/libs/api';

import { useUser, useEtc, usePost } from '@/libs/store';


export default function Page({ }) {

    const { tabIndex = 0 } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();

    const { token, mbData, pushToken, login, logout } = useUser();
    const { postStart } = usePost();

    const [index, setIndex] = useState(tabIndex * 1);

    const renderScene = ({ route }) => {
        switch (route.key) {
            case '1':
                return <FindSearchList />;
            case '2':
                return <FindRequestList />;
            case '3':
                return <FindMyPostList />;
            default:
                return null;
        }
    };
    const renderTabBar = props => (
        <TabBar
            {...props}
            // style={{ backgroundColor: colors.white,  marginHorizontal: 30, }}
            style={{ backgroundColor: colors.white, elevation: 30 }}
            indicatorStyle={{ backgroundColor: colors.taseta }}
            tabStyle={{ height: 45, elevation: 0 }}
        />
    );


    return (
        <Layout >

            {(!mbData?.carpool && !mbData?.rideShare) ? (
                <View style={[styles.root, { paddingHorizontal: rootStyle.side }]}>
                    <Lock />
                </View>
            ) : (
                <View style={styles.root}>
                    <TabView
                        swipeEnabled={Platform.OS === 'ios'}
                        renderTabBar={renderTabBar}
                        navigationState={{
                            index, routes: [
                                { key: '1', title: lang({ id: 'search' }) },
                                { key: '2', title: lang({ id: 'requests' }) },
                                { key: '3', title: lang({ id: 'my_post' }) },
                            ]
                        }}
                        onIndexChange={setIndex}
                        initialLayout={{ width: width }}
                        renderScene={renderScene}
                        lazy={true}
                        commonOptions={{
                            labelAllowFontScaling: false,
                            // labelStyle={styles.tabText}
                            label: ({ route, labelText, focused, color }) => (
                                <Text style={focused ? styles.tabTextActive : styles.tabText}>{labelText ?? route.name}</Text>
                            )
                        }}
                    />

                    <View style={styles.sticky}>
                        {/* <TouchableOpacity style={[styles.stickyButton]} activeOpacity={0.7} onPress={() => {}}>
                            <Image source={images.reload} style={rootStyle.reload} />
                        </TouchableOpacity> */}
                        <TouchableOpacity style={[styles.stickyButton, { backgroundColor: colors.main }]} activeOpacity={0.7} onPress={() => {
                            router.push(routes.postWrite)
                        }}>
                            <Text style={{...rootStyle.font(14, colors.white, fonts.medium)}}>{lang({ id: 'post_trip' })}</Text>
                            <Image source={images.add_post} style={rootStyle.default16} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}



        </Layout>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.white,
            paddingTop: insets?.top,
            paddingBottom: rootStyle.bottomTabs.height + insets.bottom,
        },

        tabText: {
            color: colors.sub_1,
            fontSize: 18,
            fontFamily: fonts.medium,
            letterSpacing: -0.36,
            overflow: 'hidden',
            flexShrink: 1,

        },
        tabTextActive: {
            color: colors.main,
            fontSize: 18,
            fontFamily: fonts.medium,
            letterSpacing: -0.36,
            overflow: 'hidden',
            flexShrink: 1,

        },
        sticky: {
            position: 'absolute',
            bottom: rootStyle.bottomTabs.height + insets.bottom + 20,
            left: 0,
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingHorizontal: rootStyle.side,
            zIndex: 10
        },
        stickyButton: {
            flexDirection: 'row',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'center',
            height: 36,
            paddingHorizontal: 12,
            borderRadius: 1000,
            backgroundColor: colors.white,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 1 }, //: -1
            shadowOpacity: 0.15,
            shadowRadius: 5, // blur 정도
            elevation: 5, // Android용 
        }

    })

    return { styles }
}
