import React, {useRef, useState, useEffect, useCallback, useMemo} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    ScrollView
} from 'react-native';

import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetScrollView,
    BottomSheetModalProvider,
    BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';

import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import Icon from '@/components/Icon';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';

import { useAlert, useConfig } from '@/libs/store';

import { numFormat, useBottomSheetModalBackHandler } from '@/libs/utils';
import images from '@/libs/images';

export default function Component({
    view,
    handleClose,
    value,
    setValue=()=>{}
}) {

    const insets = useSafeAreaInsets();
    const { styles } = useStyle();

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

    const onPress = (v) => {
        handleClose();
        setValue(v);
    }

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

    const snapPoints = useMemo(() => ["80%"], []);

    return (

        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}

            onChange={handleSheetPositionChange}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            topInset={rootStyle.header.height}

            enableDynamicSizing={false}
            enableOverDrag={false}
            backgroundStyle={{ borderRadius: 20 }}
        >
           
            <View
                style={[
                    styles.container
                ]}
            >
                <View style={ styles.titleBox }>
                    <View style={[rootStyle.flex, { justifyContent: 'space-between' }]}>
                        <Text style={styles.title}></Text>
                        <Icon img={images.exit_grey} imgStyle={rootStyle.default} onPress={handleClose} />
                    </View>
                </View>

                <BottomSheetScrollView 
                    contentContainerStyle={styles.component} 
                    showsVerticalScrollIndicator={false}
                    fadingEdgeLength={100}
                >
                        
                    <View 
                        style={{ gap: 4, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }} 
                    >
                        {configOptions?.bankOptions?.map((x, i) => {
                            return (
                                <TouchableOpacity key={i} style={[styles.list, value === x?.title && { borderColor: colors.main, gap: 4 } ]} activeOpacity={0.7} onPress={() => onPress(x?.title)}>
                                    <Image source={consts.s3Url + x?.icon} style={rootStyle.default} />
                                    <Text style={[styles.listText, value === x?.title && { color: colors.dark } ]}>{x?.title}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>

                </BottomSheetScrollView>
            
            </View>
                
            
        </BottomSheetModal>

        
    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        modal: {
            margin: 0,
            justifyContent: 'flex-end',
        },
        container: {
            padding: 20,
            gap: 20,
            backgroundColor: colors.white,
            borderRadius: 20
        },
        component: {
            paddingBottom: 50 + insets?.bottom,
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
            width: (width - 40 - 4) / 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            height: 56,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.greyE
        },
        listText: {
            fontFamily: fonts.semiBold,
            color: colors.grey9,
            fontSize: width <= 320 ? 14 : 16,
            lineHeight: 24, 
            letterSpacing: -0.4,
            textAlign: 'center',
            flex: 1,
        }
    })
  
    return { styles }
}
