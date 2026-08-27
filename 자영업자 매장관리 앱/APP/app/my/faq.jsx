import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform, Keyboard, RefreshControl, Pressable, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';
import dayjs from 'dayjs';

import { FlashList } from "@shopify/flash-list";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import TextInput from '@/components/TextInput';

import Tab from '@/components/Ui/Tab';

import Faq from '@/components/Item/Faq';

import consts from '@/libs/consts';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import protectedRouter from '@/libs/protectedRouter';

import { ToastMessage, getFullDateFormat, useDebounce } from '@/libs/utils';

import { useUser, useStore, useConfig, useAlert, useLoader } from '@/libs/store';

export default function Page() {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();

    const { mbData } = useUser();
    const { store } = useStore();

    const { configOptions } = useConfig();

    const [stx, setStx] = useState(""); // 

    const [list, setList] = useState([]); // 
    const [viewList, setVeiwList] = useState([]); // 

    const [active, setActive] = useState(''); // 

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const stxDebounce = useDebounce(stx, 200);

    useFocusEffect(
        useCallback(() => {
            dataFunc(true);
        }, [])
    );

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    useEffect(() => {

        setVeiwList(list?.filter(x => (!active || (x?.cate === active)) && (x?.title?.includes(stxDebounce) || x?.comment?.includes(stxDebounce)) ));

    }, [list, active, stxDebounce])

    const dataFunc = async (reset) => {

        if (load) return;

        setLoad(true);

        const sender = {
        }
        
        const { data, error } = await API.post('/v1/my/faq', sender);

        setList(data || []);

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);

        }, consts.apiDelay)
    }


    const header = {
        left: {
            icon: 'back',
            onPress: () => router.back()
        },
        title: '자주하는 질문',
    };

    return (
        <Layout header={header}>
            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            <View style={{ paddingHorizontal: rootStyle.side, paddingTop: 20, gap: 16, marginBottom: 7 }}>
                <Text style={{ ...rootStyle.font(22, colors.text2B2B2B, fonts.bold), lineHeight: 31 }}>궁금한 사항이 있으신가요?</Text>
                <TextInput
                    value={stx}
                    onChangeText={setStx}
                    placeholder="검색어를 입력해 주세요"
                    placeholderTextColor={colors.text9C9EA3}
                    maxLength={50}
                    
                    inputContainerStyle={{
                       borderWidth: 0,
                       backgroundColor: colors.fafafa,
                       paddingHorizontal: 14
                    }}
                    style={{
                        fontSize: 16
                    }}
                />
            </View>

            <Tab
                type={2}
                tabs={[
                    {key: '', title: '전체'},
                    ...configOptions.faqOptions.map(x => ({...x, key: x?.idx }))
                ]}
                active={active}
                setActive={setActive}
            />

            {viewList?.length < 1 ? (
                <Empty style={{ flex: 1 }} />
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingTop: 10, paddingBottom: insets?.bottom + 20, paddingHorizontal: 35 }}
                    refreshControl={
                        <RefreshControl refreshing={reload} onRefresh={() => setReload(true)} />
                    }
                    keyboardDismissMode={'on-drag'}
                >
                    {viewList?.map((x, i) => {
                        return (
                            <Faq key={x?.idx} item={x} />
                        )
                    })}
                </ScrollView>
            )}

        </Layout>
    )
}

const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        tabText: {
            color: colors.text6C7072,
            fontSize: 14,
            overflow: 'hidden',
            flexShrink: 1,
        },
        tabTextActive: {
            color: colors.primaryBright,
            fontSize: 14,
            overflow: 'hidden',
            flexShrink: 1,
        },

    })

    return { styles }
}