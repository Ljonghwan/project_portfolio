import React, { useRef, useState, useEffect } from 'react';
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
    ActivityIndicator
} from 'react-native';

import { router } from "expo-router";
import { TabView, TabBar } from 'react-native-tab-view';

import dayjs from "dayjs";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ToastMessage, regName, regPhone, regPassword } from '@/libs/utils';

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Layout from '@/components/Layout';

import NoticeList from '@/componentsPage/NoticeList';
import EventList from '@/componentsPage/EventList';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import lang from '@/libs/lang';
import consts from '@/libs/consts';

import API from '@/libs/api';

const routesTab = [
    { key: 'first', title: lang({ id: 'notice' }) },
    { key: 'second', title: lang({ id: 'event' }) },
];

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();

      const [index, setIndex] = useState(0);

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'first':
                return <NoticeList />;
            case 'second':
                return <EventList />;
            default:
                return null;
        }
    };
    const renderTabBar = props => (
        <TabBar
            {...props}
            // style={{ backgroundColor: colors.white,  marginHorizontal: 30, }}
            style={{ backgroundColor: colors.white }}
            indicatorStyle={{ backgroundColor: colors.taseta }}
            tabStyle={{ height: 45,  }}
        />
    );

    const header = {
        title: lang({ id: 'notices_events' }),
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };


    return (
        <Layout header={header} >

            <View style={styles.root}>
                <TabView
                    renderTabBar={renderTabBar}
                    navigationState={{ index, routes: routesTab }}
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

            </View>

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
            backgroundColor: colors.white 
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

        }
       
    })

    return { styles }
}
