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

import { router, usePathname, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Animated, { SequencedTransition, FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";

// component
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Layout from '@/components/Layout';
import LevelTag from '@/components/LevelTag';

import fonts from '@/libs/fonts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import images from '@/libs/images';
import consts from '@/libs/consts';
import lang from '@/libs/lang';
import dummy from '@/libs/dummy';

import API from '@/libs/api';

import { ToastMessage, numFormat } from '@/libs/utils';

import { useLang, useAlert } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

function ListItem({ item, style }) {

    const { styles } = useStyle();

	const contentHeight = useRef(0);
	const height = useSharedValue(0);
	const rotate = useSharedValue(0);

	const [active, setActive] = useState(false);
	const [measured, setMeasured] = useState(false);

    const onToggle = () => {
		setActive(prev => {
			const next = !prev;
			height.value = withTiming(next ? contentHeight.current : 0, { duration: 100 });
			rotate.value = withTiming(next ? 90 : 0, { duration: 100 });
			return next;
		});
	};

	const onContentLayout = (e) => {
		if (measured) return;
		contentHeight.current = e.nativeEvent.layout.height;
		setMeasured(true); // 다시 렌더링 트리거
	};

	const animatedStyle = useAnimatedStyle(() => ({
		height: height.value,
		overflow: 'hidden',
	}));

    const rotateStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotate.value}deg` }],
	}));

    return (
        <AnimatedTouchable
            entering={FadeIn}
            exiting={FadeOut}
            onPress={onToggle}
            style={[styles.listContainer, style]} 
        >
            <View style={[styles.listItem]} >
                <View style={[{ flex: 1, gap: 4.5 }]}>
                    <View style={[rootStyle.flex, { justifyContent: 'flex-start', gap: 6 }]}>
                        <View style={[styles.tag, { backgroundColor: item?.isAnswer ? colors.taseta : colors.taseta_sub_2 }]}>
                            <Text style={[styles.tagText, { color: item?.isAnswer ? colors.taseta_sub_2 : colors.taseta }]}>{lang({ id: item?.isAnswer ? 'resolved' : 'pending' })}</Text>
                        </View>
                        <Text style={styles.listItemDate} >{dayjs(item?.createAt).format('YYYY.MM.DD h:mm A')}</Text>
                    </View>
                    <Text style={styles.listItemTitle} numberOfLines={2}>{item?.title}</Text>
                </View>

                <Animated.View style={[rotateStyle]} >
				    <Image source={images.link} style={rootStyle.default} />
				</Animated.View>
            </View>

            {/* 보이는 애니메이션 영역 */}
			<AnimatedView style={[animatedStyle]}>
				<View style={styles.bottom}>
					<Text style={styles.dataText}>{item?.content}</Text>
					{item?.answer && (
						<View style={styles.answer}>
							<Image source={images.answer} style={rootStyle.default} />

							<View style={{ flex: 1, gap: 4 }}>
								<Text style={[styles.dataText]}>{item?.answer}</Text>
								<Text style={styles.listItemDate}>{dayjs(item?.answerAt).format('YYYY.MM.DD')}</Text>
							</View>
						</View>
					)}
				</View>
			</AnimatedView>

            {/* 렌더링 되지만 화면에 안 보이는 높이 측정용 View */}
			{!measured && (
				<View
					style={styles.hidden}
					onLayout={onContentLayout}
				>
					<View style={styles.bottom}>
						<Text style={styles.dataText}>{item?.content}</Text>
						{item?.answer && (
							<View style={styles.answer}>
								<Image source={images.answer} style={rootStyle.default} />

								<View style={{ flex: 1, gap: 4 }}>
									<Text style={[styles.dataText]}>{item?.answer}</Text>
									<Text style={styles.listItemDate}>{dayjs(item?.updateAt).format('YYYY.MM.DD')}</Text>
								</View>
							</View>
						)}
					</View>
				</View>
			)}

        </AnimatedTouchable>
    );
}

export default function Page({ }) {

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { openAlertFunc } = useAlert();

    const listRef = useRef(null);

    const [list, setList] = useState([]); // 
    const [nextToken, setNextToken] = useState(null);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(false); // 데이터 추가 로딩
    const [reload, setReload] = useState(false); // 새로고침

    const [deleteLoad, setDeleteLoad] = useState(false); // 목록삭제 로딩

    useEffect(() => {

        dataFunc(true);

    }, []);

    useEffect(() => {

        if (reload) {
            dataFunc(true);
        }

    }, [reload]);

    const dataFunc = async (reset) => {

        if (load) return;
        if (!reset && !nextToken) return;

        setLoad(true);

        let sender = {
            nextToken: reset ? null : nextToken,
            limit: 50
        }
        const { data, error } = await API.post('/v2/my/suportList', sender);

        setNextToken(data?.nextToken);

        const fetchData = data || [];
        // const fetchData = [];
        // const fetchData = dummy.getBoardDummys(100);

        setList(prev => {
            return reset ? fetchData : [...prev, ...fetchData]
        });

        setTimeout(() => {

            setInitLoad(false);
            setLoad(false);
            setReload(false);
            setDeleteLoad(false);

        }, consts.apiDelay)
    }

    const renderItem = ({ item, index }) => {

        return (
            <ListItem item={item} style={{ borderBottomWidth: index === list?.length - 1 ? 0 : 1 }} />
        )
    };

    const header = {
        left: {
            icon: 'back',
            onPress: () => {
                router.back()
            }
        },
        title: lang({ id: 'support_history' })
    };


    return (
        <Layout header={header}>

            <View style={{ flex: 1 }}>
                {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

                <FlashList
                    ref={listRef}
                    data={list}
                    renderItem={renderItem}
                    numColumns={1}
                    refreshing={reload}
                    keyExtractor={(item) => item?.idx?.toString()}
                    onRefresh={() => {
                        setReload(true);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingBottom: insets?.bottom,
                        paddingHorizontal: rootStyle.side,
                        flex: list?.length < 1 ? 1 : 'unset'
                    }}
                    keyboardDismissMode={'on-drag'}
                    keyboardShouldPersistTaps={"handled"}

                    // onEndReached={() => dataFunc()}
                    // onEndReachedThreshold={0.6}
                    // stickyHeaderIndices={[0]}
                    ListEmptyComponent={
                        <Empty msg={lang({ id: 'need_help_feel' })} image={'surport'}/>
                    }
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

        profile: {
            width: 50,
            height: 50,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },

        listContainer: {
			flex: 1,
			paddingVertical: 15,
            borderBottomWidth: 1,
            borderBlockColor: colors.sub_1
		},
        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        tag: {
            height: 19,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6.6,
            borderRadius: 10,
            backgroundColor: colors.taseta_sub_2
        },
        tagText: {
            fontFamily: fonts.medium,
            fontSize: 12,
            color: colors.taseta,
        },
        listItemTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 18,
            color: colors.main,
            letterSpacing: -0.36
        },
        listItemValue: {
            fontFamily: fonts.extraBold,
            fontSize: 20,
            color: colors.main,
            letterSpacing: -0.4
        },
        listItemDate: {
            fontSize: 16,
            fontFamily: fonts.medium,
            color: colors.sub_1,
            letterSpacing: -0.32
        },

        bottom: {
			marginTop: 20,
			gap: 20
		},
		answer: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			gap: 12,
		},
		dataText: {
			color: colors.main,
            fontFamily: fonts.medium,
			fontSize: 18,
			lineHeight: 26,
			letterSpacing: -0.36,
		},
		hidden: {
			position: 'absolute',
			top: 0,
			left: 0,
			opacity: 0,
		},

    })

    return { styles }
}
