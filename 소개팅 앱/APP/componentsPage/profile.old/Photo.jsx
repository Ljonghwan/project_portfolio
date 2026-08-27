import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, FlatList, useWindowDimensions, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInLeft} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import Text from '@/components/Text';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import ListItem from '@/components/ListItem';

import { useConfig, usePhotoPopup } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import dummy from '@/libs/dummy';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import { useBackHandler, ToastMessage } from '@/libs/utils';

const bg = Math.round(Math.random() * 0xffffff).toString(16);
const cl = Math.round(Math.random() * 0xffffff).toString(16);

export default function Component({
    name,
    value=[
     
    ],
    setValue=()=>{},
    max=4,
}) {

    const { styles } = useStyle();
    const { width, height } = useSafeAreaFrame();

    const { configOptions } = useConfig();
    const { openPhoto, openPhotoFunc, closePhotoFunc } = usePhotoPopup();

    useEffect(() => {


    }, [])

    const photoFunc = (index) => {

        openPhotoFunc({
            setPhoto: (v) => setPhoto({ v: v?.[0], i: index }),
            deleteButton: true
        })
        
    }

    const photoAddFunc = () => {

        openPhotoFunc({
            setPhoto: (v) => {
                setValue({ value: v, name })
            },
            selectionLimit: max,
            photoMode: 'library'
        })
        
    }

    const setPhoto = ({ v, i }) => {

        if(!v) {
            setValue({ value: value?.filter((item, index) => index !== i), name })
        } else {
            setValue({ 
                value: value?.map((item, index) => {
                    if(index === i) return v;
                    return item
                }), 
                name
            })
        }
        
    }

    return (
        <View style={styles.root}>
            <Animated.View entering={FadeInLeft} style={{ gap: 8 }}>
                <Text style={styles.title}>회원님의 사진을 등록해 주세요.</Text>
            </Animated.View>
            <View style={[rootStyle.flex, { flex: 1 }]}>
                <ScrollView
                    style={{
                        flex: 1,
                        height: '100%'
                    }}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                >
                    {value?.length > 0 ? (
                        <View style={{ gap: 18 }}>
                            <View style={styles.itemList}>
                                {[...Array(max)]?.map((item, index) => {
                                    return (
                                        <View key={index} style={[styles.item, index === 0 && styles.itemMain ]}>
                                            {value?.[index] && (
                                                <Image 
                                                    source={value?.[index]?.uri || consts.s3Url + value?.[index]} 
                                                    style={[styles.itemImage]} 
                                                    transition={200}
                                                />
                                            )}
                                            
                                            {index === 0 && (
                                                <Animated.View entering={FadeIn} style={styles.badge}>
                                                    <Image source={images.main_profile} style={rootStyle.default14} />
                                                    <Text style={styles.badgeText}>메인 프로필 사진</Text>
                                                </Animated.View>
                                            )}
                                        </View>
                                    )
                                })}
                            </View>
                            <TouchableOpacity style={[styles.uploadButton, { flexDirection: 'row', aspectRatio: 'auto', paddingVertical: 20, gap: width <= 320 ? 12 : 20 }]} activeOpacity={0.5} onPress={photoAddFunc}>
                                <Image source={images.upload} style={{ width: 36, aspectRatio: 1 }} />
                                <View>
                                    <Text style={{...rootStyle.font(width <= 320 ? 14 : 18, colors.primary, fonts.medium), lineHeight: 26, textAlign: 'center', letterSpacing: -0.63 }}>터치하여 이미지를 다시 업로드</Text>
                                    <Text style={{...rootStyle.font(width <= 320 ? 11 : 14, colors.primary, fonts.light), letterSpacing: -0.49}}>{`* 최소 1장, 최대 4장까지 등록 가능합니다.\n* 첫번째 사진은 메인 사진으로 지정됩니다.`}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.uploadButton} activeOpacity={0.5} onPress={photoAddFunc}>
                            <Image source={images.upload} style={{ width: 80, aspectRatio: 1 }} />
                            <Text style={{...rootStyle.font(20, colors.primary, fonts.medium), textAlign: 'center' }}>터치하여 이미지를 업로드</Text>
                            <Text style={{...rootStyle.font(14, colors.primary, fonts.light)}}>{`*최소 1장, 최대 4장까지 등록 가능합니다.\n* 첫번째 사진은 메인 사진으로 지정됩니다.`}</Text>
                        </TouchableOpacity>
                    )}

                    
{/* 
                    {value?.map((item, index) => {
                        return (
                            <TouchableOpacity key={index} style={styles.item} activeOpacity={0.5} onPress={() => photoFunc(index)}>
                                <Image 
                                    source={item?.uri || consts.s3Url + item} 
                                    style={[styles.itemImage]} 
                                    transition={200}
                                />
                                {index === 0 && (
                                    <Animated.View entering={FadeIn} style={styles.badge}>
                                        <Text style={styles.badgeText}>대표</Text>
                                    </Animated.View>
                                )}
                            </TouchableOpacity>
                        )
                    })}

                    {[...Array(max - (value?.length || 0))].map((x, i) => {
                        return (
                            <TouchableOpacity key={"list2_" + i} style={[styles.item, { backgroundColor: colors.mainOp5 }]} activeOpacity={0.5} onPress={photoAddFunc}>
                                <Image 
                                    source={images.add} 
                                    style={rootStyle.default32} 
                                    transition={200}
                                />
                            </TouchableOpacity>
                        )
                    })} */}

                    {/* {value?.length < max && (
                        <TouchableOpacity style={[styles.item, { backgroundColor: colors.mainOp5 }]} activeOpacity={0.5} onPress={photoAddFunc}>
                            <Image 
                                source={images.add} 
                                style={rootStyle.default32} 
                                transition={200}
                            />
                        </TouchableOpacity>
                    )} */}
                    

                </ScrollView>
              
            </View>
        </View>
    );
}



const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();

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
        uploadButton: {
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.main2,
            width: '100%',
            aspectRatio: width > 500 ? 2 : 1,
            gap: 20
        },
        list: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 4, 
            paddingBottom: insets.bottom + 100,
            paddingTop: 20
        },
        itemList: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 3, 
            borderRadius: 20,
            overflow: 'hidden',
        },
        itemMain: {
            width: '100%',
            flex: '3/4'
        },
        item: {
            flex: 1,
            aspectRatio: "1/1",
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: colors.greyD9,
        },
        itemImage: {
            width: '100%',
            height: '100%'
        },








      
        
        
        badge: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 10,
            height: 30,
            borderRadius: 12,
            backgroundColor: colors.white,
            position: 'absolute',
            top: 10,
            left: 10,
            gap: 4,
            borderWidth: 0.5,
            borderColor: colors.grey6
        },
        badgeText: {
            fontSize: 12,
            lineHeight: 16,
            fontFamily: fonts.semiBold,
            color: colors.grey6
        }
	})

  	return { styles }
}

