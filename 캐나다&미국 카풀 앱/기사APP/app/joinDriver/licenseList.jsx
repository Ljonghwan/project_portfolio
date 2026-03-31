import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, useWindowDimensions } from 'react-native';

import { Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { TabView, TabBar } from 'react-native-tab-view';
// import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';

import LicenseList from '@/componentsPage/LicenseList';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import lang from '@/libs/lang';
import consts from '@/libs/consts';

import { ToastMessage, regPhone, useBackHandler } from '@/libs/utils';

import { useUser, useAlert, useLoader } from '@/libs/store';


const routesTab = [
    { key: 'first', title: 'Canada' },
    { key: 'second', title: 'United States' },
];

export default function Page() {

    const { cate } = useLocalSearchParams();
    const { width, height } = useWindowDimensions();

    const { styles } = useStyle();
    const { mbData, login } = useUser();


    const [index, setIndex] = useState(0);

    const [load, setLoad] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [error, setError] = useState({});


    useEffect(() => {
        // GoogleSignin.configure();
    }, [])

    const onSubmit = () => {
        router.back();
    }

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'first':
                return  <LicenseList />;
            case 'second':
                return <LicenseList country={consts.countryOptions[1].idx} />;
            default:
                return null;
        }
    };
    const renderTabBar = props => (
        <TabBar
            {...props}
            style={{ backgroundColor: colors.white }}
            indicatorStyle={{ backgroundColor: colors.taseta }}
            tabStyle={{ height: 45 }}
        />
    );

  
    return (
        <View
            style={styles.root}
        >
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
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.white 
        },
        title: {
            color: colors.main,
            fontSize: 40,
            fontFamily: fonts.goudy,
            textAlign: 'center'
        },
        subTitle: {
            color: colors.sub_1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.medium,
            letterSpacing: -0.64,
            textAlign: 'center'
        },
        tabbar: {
            borderBottomWidth: 1,
            borderBottomColor: colors.sub_2,
            paddingHorizontal: rootStyle.side 
        },
        tabText: { 
            color: colors.sub_1,
            fontSize: 17,
            fontFamily: fonts.medium,
            letterSpacing: -0.36,
            overflow: 'hidden',
            flexShrink: 1,

        },
        tabTextActive: { 
            color: colors.main,
            fontSize: 17,
            fontFamily: fonts.medium,
            letterSpacing: -0.36,
            overflow: 'hidden',
            flexShrink: 1,

        }

    })

    return { styles }
}