import React, {useEffect, useRef, useState, useCallback} from 'react';

import {
    StyleSheet,
    TouchableOpacity,
    View,
    useWindowDimensions,
    Platform,
    StatusBar,
    ImageBackground,
    Dimensions,
    Pressable,
} from 'react-native';

import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Bell from '@/components/Bell';
import Help from '@/components/Help';
import ListText from '@/components/ListText';

import consts from '@/libs/consts';
import routes from '@/libs/routes';

export default function Header({
    header,
    bg,
}) {
    const { presentation } = useLocalSearchParams();

    const { width, height } = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const { styles } = useStyle();

    const [view, setView] = useState(false);
    const [viewPosition, setViewPosition] = useState({});

    const paddingTop = (presentation && Platform.OS === 'ios') ? 0 : insets?.top;
    const headerHeight = rootStyle?.header?.height + ( (presentation && Platform.OS === 'ios') ? 0 : insets?.top );

    const onLayout = useCallback((event) => {
        event.target.measure(
            (x, y, width, height, pageX, pageY) => {
                setViewPosition({ y: pageY + height + 10 })
            },
        );

    }, []);

    return (
        <View 
            style={[
                styles.header, 
                ...[{ 
                        backgroundColor: bg, 
                        paddingTop: paddingTop,
                        height: headerHeight,
                    }]
            ]}
        >

            <View style={styles.container}>
                {header?.title && (
                    <View style={[ rootStyle.flex, { gap: 10, paddingLeft: header?.left ? 58 : 10 },]}>
                        {header?.titleIcon && (
                            <Image source={images?.[header?.titleIcon?.icon]} style={[rootStyle?.default, header?.titleIcon?.style]} tintColor={header?.titleIcon?.tintColor || null} />
                        )}
                        <Pressable style={[ rootStyle.flex, { flex: 1, justifyContent: 'flex-start' }]} onPress={() => {
                            if(!header?.titleInfo) return;
                            setView(true)
                        }}>
                            <Text style={[styles.header_title, header?.titleStyle]} >{header?.title}</Text>
                            {header?.titleInfo && (
                                <>
                                    <Image source={images?.[header?.titleInfo?.icon] || images?.info_black} style={[rootStyle?.[header?.titleInfo?.icon] || rootStyle?.default ]} collapsable={false} onLayout={onLayout}/>
                                    <Help 
                                        view={view} 
                                        setView={setView} 
                                        position={viewPosition}
                                        component={
                                            <View style={styles.infoBox}>
                                                <Text style={styles.infoBoxText}>{header?.titleInfo?.message}</Text>
                                            </View>
                                        } 
                                    />
                                </>
                            )}
                        </Pressable>
                        
                    </View>
                )}
                
                {header?.leftTitle && (
                    <View style={styles.left}>
                        <Text style={styles.header_left_title}>{header?.leftTitle}</Text>
                    </View>
                )}

                {header?.left && (
                    <TouchableOpacity
                        style={styles.left}
                        activeOpacity={header?.left?.onPress ? 0.2 : 1}
                        onPress={header?.left?.onPress || null}
                    >
                        {header?.left?.icon && (
                            <Image source={images?.[header?.left?.icon]} style={[header?.left?.iconStyle || rootStyle?.[header?.left?.icon] || rootStyle?.default]} />
                        )}
                        {header?.left?.image && (
                            <Image source={header?.left?.image} style={styles.leftImage} />
                        )}
                        {header?.leftTitleWithIcon && (
                            <Text style={[styles.header_left_title_with_icon, { maxWidth: header?.right ? width / 2 : width - 70 } ]} numberOfLines={1}>{header?.leftTitleWithIcon}</Text>
                        )}
                    </TouchableOpacity>
                )}

                {header?.right && (
                    <TouchableOpacity
                        style={[styles.right]}
                        onPress={header?.right?.onPress || null}
                    >
                        {header?.right?.icon && (
                            <Image source={images?.[header?.right?.icon]} style={rootStyle?.[header?.right?.icon] || rootStyle?.default} tintColor={header?.right?.iconTintColor || null}/>
                        )}
                        {header?.right?.image && (
                            <View style={styles.rightImage}>
                                <Image source={header?.right?.image} style={[styles.rightImageStyle, header?.right?.imageStyle]} />
                                <Text style={[styles.rightImageLabel ]} numberOfLines={1}>{header?.right?.imageLabel}</Text>
                            </View>
                        )}
                        {header?.right?.text && (
                            <Text style={[styles.header_text_button, header?.right?.textStyle]}>{header?.right?.text}</Text>
                        )}
                        {header?.right?.bell && (
                            <Bell />
                        )}

                        {header?.right?.component && (
                            header?.right?.component
                        )}
                        
                    </TouchableOpacity>
                )}

                {header?.chat && (
                    <View style={[rootStyle.flex, { flex: 1, justifyContent: 'flex-start', paddingRight: 12 }]}>
                        <TouchableOpacity style={[ rootStyle.flex, { height: rootStyle.header.height }]} onPress={() => router.back() }>
                            <Image source={images.back} style={[rootStyle.back]} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[ rootStyle.flex, { flex: 1, gap: 8, justifyContent: 'flex-start' }]} onPress={() => {

                            if(header?.chat?.roomType === 3) {
                                router.navigate({
                                    pathname: routes.managerDetail,
                                    params: {
                                        idx: header?.chat?.user?.idx,
                                        title: consts.manager?.[`manager${header?.chat?.user?.level}`]?.title
                                    }
                                });
                            } else {
                                router.navigate({
                                    pathname: routes.chatProfile,
                                    params: {
                                        idx: header?.chat?.user?.idx,
                                        roomIdx: header?.chat?.roomIdx
                                    }
                                })
                            }
                            
                        }}>
                            <Image source={header?.chat?.user?.profile ? consts.s3Url + header?.chat?.user?.profile : images.profile} style={styles.chatProfile} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.chatTitle} numberOfLines={1}>{header?.chat?.user?.name}</Text>
                                {header?.chat?.user?.type && <Text style={styles.chatSubTitle} numberOfLines={1}>{header?.chat?.user?.type}</Text> }
                            </View>
                        </TouchableOpacity>

                        <View style={[ rootStyle.flex, { gap: 8 }]}>
                            {header?.chat?.flirting && <Icon img={images.chat_header_flirting} imgStyle={rootStyle.default36} onPress={header?.chat?.flirting}/> }
                            {header?.chat?.time && 
                                <View>
                                    <Icon img={images.chat_header_time} imgStyle={rootStyle.default36} onPress={header?.chat?.time}/>
                                    {header?.chat?.timeDot && (
                                        <View style={styles.dot} />
                                    )}
                                </View> 
                            }
                            {header?.chat?.call && <Icon img={images.chat_header_call} imgStyle={rootStyle.default36} onPress={header?.chat?.call}/> }
                            {header?.chat?.end && <Icon img={images.chat_header_end} imgStyle={rootStyle.default36} onPress={header?.chat?.end}/> }
                        </View>
                    </View>
                )}
            </View>
      
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        header: {
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            width: '100%',
        },
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            flex: 1
        },
        header_title: {
            fontSize: 16,
            color: colors.dark,
            fontFamily: fonts.semiBold,
            textAlign: 'left',
        },
        header_left_title: {
            fontSize: 20,
            fontFamily: fonts.semiBold,
            color: colors.dark,
            paddingLeft: 10
        },
        header_left_title_with_icon: {
            fontSize: 16,
            fontFamily: fonts.semiBold,
            color: colors.dark,
        },
        header_text_button: {
            fontSize: 14,
            fontFamily: fonts.semiBold,
            color: colors.grey6, 
            textAlign: 'center',
            paddingHorizontal: 10
        },
        left: {
            paddingHorizontal: rootStyle.side,
            height: rootStyle?.header?.height,
            position: 'absolute',
            left: 0,
            top: 0,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 3,
        },
        leftImage: {
            width: 24,
            height: 24,
            borderRadius: 100,
            marginRight: 4
        },
        right: {
            // paddingHorizontal: 30,
            width: 66,
            height: rootStyle?.header?.height,
            position: 'absolute',
            right: 0,
            top: 0,
            alignItems: 'center',
            justifyContent: 'center',
        },
        rightImage: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            width: width / 3,
        },
        rightImageLabel: {
            fontSize: 14,
            fontFamily: fonts.semiBold,
            color: colors.dark,
        },
        rightImageStyle: {
            width: 24,
            height: 24,
            borderRadius: 100,
        },






        chatProfile: {
            width: 48, 
            aspectRatio: 1/1, 
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        chatTitle: {
            fontSize: 14,
            lineHeight: 20,
            fontFamily: fonts.semiBold,
            color: colors.dark,
            letterSpacing: -0.35,
            flexShrink: 1
        },
        chatSubTitle: {
            fontSize: 12,
            lineHeight: 16,
            color: colors.grey6,
            letterSpacing: -0.3,
        },





        infoBox: {
            padding: 16,
            borderWidth: 1,
            borderColor: colors.main,
            borderRadius: 12,
        },
        infoBoxText: {
            color: colors.dark,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35
        },
    
        dot: {
            width: 4,
            height: 4,
            borderRadius: 1000,
            backgroundColor: colors.red,
            position: 'absolute',
            top: 4,
            right: 4
        }
    })
  
    return { styles }
}
