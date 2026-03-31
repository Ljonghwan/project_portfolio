import React, {useRef, useState, useEffect, useCallback} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard
} from 'react-native';

import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetModalProvider,
    BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import Icon from '@/components/Icon';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';

import { useAlert, useConfig } from '@/libs/store';

import { numFormat, useBottomSheetModalBackHandler } from '@/libs/utils';
import images from '@/libs/images';

export default function Component({
    view,
    handleClose,
    list
}) {

    const insets = useSafeAreaInsets();
    const { styles } = useStyle();

    const { 
        openAlertFunc,
    } = useAlert();

    const { configOptions } = useConfig();

    const bottomSheetModalRef = useRef(null);

    const { handleSheetPositionChange } = useBottomSheetModalBackHandler(bottomSheetModalRef, () => handleClose() );

    useEffect(() => {
        if(view) {
            Keyboard.dismiss();

            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }

    }, [view, bottomSheetModalRef])


    const renderBackdrop = useCallback(
		(props) => (
			<BottomSheetBackdrop
				{...props}
				disappearsOnIndex={-1}
				appearsOnIndex={0}
			/>
		),
		[]
	);


    return (

        <BottomSheetModal
            ref={bottomSheetModalRef}
            onChange={handleSheetPositionChange}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            topInset={rootStyle.header.height}
            enableOverDrag={false}
            enableDynamicSizing={true}
            backgroundStyle={{ backgroundColor: 'transperate', borderRadius: 20, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
            <View>
                <BottomSheetView style={styles.component}>
                    <View
                        style={[
                            styles.container
                        ]}
                    >
                        <View style={ styles.titleBox }>
                            <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                                <Text style={styles.title}>자산 클래스</Text>
                                <Icon img={images.exit_grey} imgStyle={rootStyle.default} onPress={handleClose} />
                            </View>
                            <Text style={styles.subTitle}>현재 보유하고 있는 플러팅 순위</Text>
                        </View>
                        <View style={{ gap: 8 }}>
                            {list?.map((x, i) => {
                                return (
                                    <View key={i} style={styles.list}>
                                        <Image source={images?.[`class_${x?.name}`]} style={[styles.listImage, i === 0 && { width: 120 } ]}/>

                                        <View style={[rootStyle.flex, { gap: 8 } ]}>
                                            <View style={styles.ratioBox}>
                                                <Text style={[styles.ratioText, i === 0 && { fontSize: 16 } ]}>상위 {x?.ratio}%</Text>
                                            </View>
                                            <Text style={[styles.listText, i === 0 && { fontSize: 20 } ]}>{numFormat(x?.count)}명</Text>
                                        </View>
                                    </View>
                                )
                            })}
                        </View>
                    
                    </View>
                </BottomSheetView>
                
            </View>
        </BottomSheetModal>

        
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        modal: {
            margin: 0,
            justifyContent: 'flex-end',
        },
        component: {
            overflow: 'hidden',
        },
       
        container: {
            padding: 20,
            paddingBottom: 20 + insets?.bottom,
            gap: 20,
            backgroundColor: colors.white,
            borderRadius: 20,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0
        },
        titleBox: {
            gap: 4,
        },
        title: {
            color: colors.dark,
            fontSize: 24,
            lineHeight: 32,
            fontFamily: fonts.semiBold,
        },
        subTitle: {
            color: colors.grey6,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
        },
        list: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.greyE
        },
        listImage: {
            width: 100,
            ...rootStyle.rankBadge
        },
        listText: {
            fontFamily: fonts.semiBold,
            color: colors.dark,
            fontSize: 16,
            lineHeight: 20, 
            letterSpacing: -0.4,
        },
        ratioBox: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: colors.greyF1
        },
        ratioText: {
            fontFamily: fonts.semiBold,
            color: colors.dark,
            fontSize: 12,
            letterSpacing: -0.3,
        }
    })
  
    return { styles }
}
