import { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInLeft } from 'react-native-reanimated';

import { Image } from 'expo-image';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import dummy from '@/libs/dummy';
import rootStyle from '@/libs/rootStyle';
import API from '@/libs/api';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function ItemSido({ delay=0, active, title, onPress }) {

    const textColor = useSharedValue(colors.grey9);

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(textColor.value, { duration: 150 }),
        };
    });

    useEffect(() => {
        textColor.value = !active ? colors.grey9 : colors.dark; 
    }, [active])

    return (
        <View 
            style={{ flex: 1 }}
        >
            <TouchableOpacity style={[styles.sido, active && styles.sidoActive]} onPress={onPress} activeOpacity={1}>
                <Animated.Text style={[styles.sidoText, animatedTextStyle, { fontSize: title?.length > 6 ? 14 : 16 }]} numberOfLines={1}>{title}</Animated.Text>
                {active && <Image source={images.detail} style={[rootStyle.default]} />}
            </TouchableOpacity>
        </View>
    );
}

function ItemSigungu({ delay=0, active, title, onPress }) {

    const backgroundColor = useSharedValue(colors.white);
    const textColor = useSharedValue(colors.grey9);

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            color: withTiming(textColor.value, { duration: 150 }),
        };
    });

    useEffect(() => {
        backgroundColor.value = !active ? colors.white : colors.primaryLight; 
        textColor.value = !active ? colors.grey9 : colors.dark; 
    }, [active])

    return (
        <View 
            style={{ flex: 1 }}
        >
            <TouchableOpacity style={[styles.sigungu, active && styles.sigunguActive]} onPress={onPress} activeOpacity={1}>
                <Animated.Text style={[styles.sidoText, animatedTextStyle]} numberOfLines={1}>{title}</Animated.Text>
            </TouchableOpacity>
        </View>
    );
}

export default function Component({
    name,
    subName,
    value="서울",
    subValue,
    setValue=()=>{},
    target
}) {

    const scref1 = useRef();
    const scref2 = useRef();

    const [ sido, setSido ] = useState([]);
    const [ sigungu, setSigungu ] = useState([]);

    useEffect(() => {

        getSido();

    }, [])

    useEffect(() => {
        getSigungu();

        setTimeout(() => {
            if(value && sido?.length > 0) {
                const target = sido.findIndex(item => item === value);
    
                console.log('value', value, target);
                scref1?.current?.scrollToIndex({
                    index: target < 0 ? 0 : target,
                    animated: true
                });
            }
    
            scref2?.current?.scrollToOffset({
                offset: 0,
                animated: true
            });
        }, 200)
        
        // scref.current.scrollTo({x: 0, y: 0, animated: true});

    }, [value, sido])

    useEffect(() => {

        setTimeout(() => {
            if(subValue && sigungu?.length > 0) {
                const target = sigungu.findIndex(item => item === subValue);
                scref2?.current?.scrollToIndex({
                    index: target < 0 ? 0 : target,
                    animated: true
                });
            }
        }, 200)
        
        // scref.current.scrollTo({x: 0, y: 0, animated: true});

    }, [subValue, sigungu])
    
    const renderItem = ({ item, index }) => {
        return (
            <ItemSido delay={index*20} active={(value === item)} title={item} onPress={() => {
                setValue({ value: item, name: name });
                setValue({ value: null, name: subName });
            }}/>
        );
    };

    const renderItemSigungu = ({ item, index }) => {
        return (
            <ItemSigungu delay={index*20} active={(subValue === item)} title={item} onPress={() => setValue({ value: item, name: subName })}/>
        );
    };

    const getSido = async () => {
        const { data } = await API.post('/sido');
        setSido(data);
    }

    const getSigungu = async () => {
        const { data } = await API.post('/sigungu', { sido: value } );
        setSigungu(data);
    }
    return (
        <View 
            style={styles.root}
        >
            <Animated.View entering={FadeInLeft}>
                <Text style={styles.title}>{target ? '원하는 상대방의' : '회원님의'} <Text style={styles.span}>선호 지역</Text>을 선택해주세요.</Text>
            </Animated.View>
            {/* <Text style={styles.title}>{value}</Text>
            <Text style={styles.title}>{subValue}</Text> */}

            
            <Animated.View entering={FadeIn} style={[rootStyle.flex, { flex: 1 }]}>

                <FlatList
                    ref={scref1}
                    data={sido}
                    renderItem={renderItem}
                    numColumns={1}
                    style={[styles.scroll, { paddingRight: 12 }]} 
                    contentContainerStyle={{ paddingBottom: 20}} 
                    showsVerticalScrollIndicator={false}
                    getItemLayout={(data, index) => ({
                        length: styles.sido.height, // 각 항목의 높이
                        offset: styles.sido.height * index, // 항목의 오프셋
                        index,
                    })}
                />
                {sigungu?.length > 0 ? (
                    <FlatList
                        ref={scref2} 
                        data={sigungu}
                        renderItem={renderItemSigungu}
                        numColumns={1}
                        style={[styles.scroll]} 
                        contentContainerStyle={[styles.scrollBorder, { marginBottom: 20 }]} 
                        showsVerticalScrollIndicator={false}
                        getItemLayout={(data, index) => ({
                            length: styles.sigungu.height, // 각 항목의 높이
                            offset: styles.sigungu.height * index, // 항목의 오프셋
                            index,
                        })}
                            
                    />
                ) : (
                    <View style={{ flex: 1 }}/>
                )}
                
{/* 
                <ScrollView style={[styles.scroll, { paddingRight: 12 }]} contentContainerStyle={{ paddingBottom: 20}} showsVerticalScrollIndicator={false}>
                    {sido?.map((x, i) => {
                        return (
                            <ItemSido key={i} delay={i*20} active={(value === x.idx)} title={x.sido} onPress={() => setValue({ value: x.idx, name: name })}/>
                         
                        )
                    })}
                </ScrollView> */}

                {/* <ScrollView ref={scref} style={[styles.scroll]} contentContainerStyle={[{ paddingBottom: 20 }]} showsVerticalScrollIndicator={false}>
                    {sigungu?.length > 0 && (
                        <View style={styles.scrollBorder}>
                            {sigungu?.map((x, i) => {
                                return (
                                    <ItemSigungu key={i} delay={i*20} active={(subValue === x.idx)} title={x.sigungu} onPress={() => setValue({ value: x.idx, name: subName })}/>                                    
                                )
                            })}
                        </View>
                    )}
                   
                </ScrollView> */}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 20
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
        
    },
    sido: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 56,
        borderRadius: 8,
        
        borderWidth: 1,
        borderColor: 'transparent'
    },
    sidoActive: {
        
        borderColor: colors.primary,
        backgroundColor: colors.mainOp5,
        shadowColor: colors.primary, 
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1, 
        shadowRadius: 12, 
        // Android 그림자 속성
    },
    sidoText: {
        color: colors.grey9,
        fontFamily: fonts.semiBold,
        fontSize: 16,
        lineHeight: 24,
        flex: 1
    },
    sigungu: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 56,
    },
    sigunguActive: {
        backgroundColor: colors.mainOp5
    }
    
});
