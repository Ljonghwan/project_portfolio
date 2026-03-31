import { useRef, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Image } from 'expo-image';

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import ListText from '@/components/ListText';
import CheckBox2 from '@/components/CheckBox2';

import RematchProduct from '@/componentsPage/payment/RematchProduct';

import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import consts from '@/libs/consts';
import images from '@/libs/images';
import fonts from '@/libs/fonts';

import API from '@/libs/api';

import { useUser, useEtc } from '@/libs/store';
import { numFormat } from '@/libs/utils';


const routesTab = [
    { key: 'first', title: '주선 비용+플러팅 10개' },
    { key: 'second', title: '주선 비용만' },
];

export default function Page() {

    const { idx, comment, price, productIdx } = useLocalSearchParams();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    
    const { goTop } = useEtc();

    const insets = useSafeAreaInsets();
    const listRef = useRef(null);

    const [index, setIndex] = useState(0);

    const [ agree, setAgree ] = useState(false); 

    const [disabled, setDisabled] = useState(false);
    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    useEffect(() => {

        dataFunc(true);

    }, []);

    useEffect(() => {
        setDisabled( !(agree) );
    }, [agree])
    
    const dataFunc = () => {

        setTimeout(() => {
         
            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }
   
    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'first':
                return <RematchProduct type={1} />;
            case 'second':
                return <RematchProduct type={2} />;
            default:
                return null;
        }
    };
    const renderTabBar = props => (
        <TabBar
            {...props}
            style={{ backgroundColor: colors.white }}
            indicatorStyle={{ backgroundColor: colors.main, height: 1 }}
            tabStyle={{ height: 50 }}
        />
    );

    const submitFunc = () => {

        router.replace({
            pathname: routes.paymentRematchStart,
            params: {
                idx, comment, price, productIdx
            }
        })

    }

    const header = {
        title: '주선 비용 결제',
        left: {
            icon: 'back',
            onPress: () => {
                router.back();
            }
        }
    };

    // router.dismissTo({
    //     pathname: routes.cs,
    //     params: { back: true },
    // });

    return (
        <Layout header={header} statusBar={'dark'} backgroundColor={colors.white}>

            {initLoad && ( <Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed /> )}

            <View style={{ flex: 1 }}>
                {/* {initLoad && <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />} */}
            
                <View style={styles.root }>
                    <View style={{ gap: 40 }}>
                        <View style={styles.top}>
                            <View style={{ gap: 24 }}>
                                <Text style={styles.topTitle}>{`주선 비용 결제 금액입니다.`}</Text>
                                
                                <View style={[ rootStyle.flex, { gap: 8 }]}>
                                    <Image source={images.won_gray} style={[rootStyle.default32]}/>
                                    <Text style={styles.topCount}>{numFormat(price)}원</Text>
                                </View>
                            </View>
                        </View>
                    
                        <View style={styles.bottom}>
                            <Text style={[styles.topTitle, { textAlign: 'left' } ]}>환불 약관</Text>

                            {/* <View style={styles.term}>
                                {load2 && ( <Loading entering={false} color={colors.black} style={styles.loader} /> )}
                                <EditorView 
                                    content={term?.content}
                                    onLoad={() => {
                                        setLoad2(false)
                                    }}
                                    bottomInit={1}
                                />
                            </View> */}

                            <View style={styles.term}>
                                <ListText style={styles.termText}>주선 비용만 결제하는 상품입니다.</ListText>
                                <ListText style={styles.termText}>리매치에 실패하면 주선 비용은 100% 환불이 가능합니다.</ListText>
                                <ListText style={styles.termText}>
                                    {`주선 비용 `}
                                    <Text style={[styles.termText, { color: colors.main }]}>{numFormat(price)}원</Text>
                                    {`으로 결제됩니다.`}
                                </ListText>
                                
                            </View>

                        
                            <CheckBox2
                                fontStyle={styles.check}
                                label={`환불 약관을 확인했으며 동의합니다.`}
                                checked={agree}
                                onCheckedChange={(v) => {
                                    setAgree(v)
                                }}
                            />
                        </View>

                    </View>
                </View>

                <Button type={'3'} disabled={disabled} onPress={submitFunc} load={load} bottom>결제하기</Button>
            </View>
            
            {/* <RematchProduct type={1} /> */}

            {/*             
            <TabView
                renderTabBar={renderTabBar}
                navigationState={{ index, routes: routesTab }}
                onIndexChange={setIndex}
                initialLayout={{ width: width }}
                renderScene={renderScene}
                lazy={true}
                renderLazyPlaceholder={() => {
                    return <Loading style={{ backgroundColor: colors.white }} color={colors.dark} fixed entering={false} />
                }}
                commonOptions={{
                    labelAllowFontScaling: false,
                    // labelStyle={styles.tabText}
                    label: ({ route, labelText, focused, color }) => (
                        <Text style={focused ? styles.tabTextActive : styles.tabText}>{labelText ?? route.name}</Text>
                    )
                }}
            /> */}

        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        tabText: { 
            color: colors.greyC,
            fontSize: 14,
            letterSpacing: -0.35,
            overflow: 'hidden',
            flexShrink: 1,
        },
        tabTextActive: { 
            color: colors.main,
            fontSize: 14,
            fontFamily: fonts.medium,
            letterSpacing: -0.35,
            overflow: 'hidden',
            flexShrink: 1,
        },


        root: {
            flex: 1,
            padding: 20,
            paddingTop: 32 
        },
        headerText: {
            paddingHorizontal: 0,
            right: 10,
            color: colors.main
        },
        top: {
            position: 'relative',
            gap: 20
        },
        topTitle: {
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4,
            fontFamily: fonts.semiBold,
            color: colors.dark,
            textAlign: 'center'
        },
        topCount: {
            fontSize: 20,
            fontFamily: fonts.medium,
            color: colors.dark
        },
    
        bottom: {
            gap: 8
        },
        term: {
            backgroundColor: colors.greyF8,
            padding: 12,
            gap: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.greyE,
            overflow: 'hidden'
        },
        termText: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.grey6,
            letterSpacing: -0.35,
        },
        loader: {
            position: 'absolute', 
            top: 0, 
            left: 0, 
            zIndex: 10000,
            backgroundColor: colors.white
        },
        check: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.dark,
            letterSpacing: -0.35,
            fontFamily: fonts.regular
        },

        
    })

    return { styles }
}