import React, {useRef, useState, useEffect, useCallback} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    Platform
} from 'react-native';

import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetModalProvider,
    BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';

import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import Text from '@/components/Text';
import Button from '@/components/Button';
import CallObjectionTextInput from '@/components/CallObjectionTextInput';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';

import { useAlert, useConfig } from '@/libs/store';

import { useBottomSheetModalBackHandler } from '@/libs/utils';

export default function Component({
    view,
    value,
    handleClose,
    onSubmit
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
            backgroundStyle={{ backgroundColor: 'rgba(0,0,0,0)', borderRadius: 20 }}
            detached={true}
            bottomInset={insets?.bottom + (Platform.OS === 'ios' ? 0 : 20)}
            style={{ marginHorizontal: 12 }}
        >
            <View>
                <BottomSheetView style={styles.component}>
                    <View style={styles.root}>
                        <View
                            style={[
                                styles.container
                            ]}
                        >
                            <View style={ styles.titleBox }>
                                <Text style={styles.title}>문의 유형</Text>
                                <Text style={styles.subTitle}>문의 유형을 선택해 주세요.</Text>
                            </View>
                            <View>
                                {configOptions?.csOptions?.map((x, i) => {
                                    return (
                                        <TouchableOpacity key={i} style={[styles.list, value === x && styles.listActive]} onPress={() => {
                                            onSubmit(x);
                                            handleClose();
                                        }}>
                                            <Text style={[styles.listText, value === x && styles.listTextActive]}>{x}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        
                        </View>

                        <Button type={4} containerStyle={{ height: 56 }} onPress={handleClose}>취소</Button>
                        {/* <View style={ styles.bottom }>
                            <TouchableOpacity style={[rootStyle.flex, { flex: 1, height: '100%' }]} onPress={handleClose}>
                                <Text style={styles.bottomText}>취소</Text>
                            </TouchableOpacity>
                        </View> */}
                    </View>
                </BottomSheetView>
                
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
        main: {
            padding: 20,
            paddingBottom: 20 + insets?.bottom,
        },
        component: {
            overflow: 'hidden',
        },



        root: {
            gap: 8
        },
        container: {
            padding: 20,
            backgroundColor: colors.white,
            borderRadius: 20
        },
        titleBox: {
            gap: 4,
            paddingBottom: 20,
            marginBottom: 20,
            borderBottomColor: colors.greyE,
            borderBottomWidth: 1
        },
        title: {
            color: colors.dark,
            fontSize: 20,
            fontFamily: fonts.semiBold,
            textAlign: 'center'
        },
        subTitle: {
            color: colors.grey6,
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            textAlign: 'center'
        },
        list: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 44
        },
        listActive: {
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: 12,
        },
        listText: {
            color: colors.grey9,
            fontSize: width <= 340 ? 13 : 15,
            lineHeight: 20,
            letterSpacing: -0.4,
            textAlign: 'center',
        },
        listTextActive: {
            color: colors.dark,
        },
        bottom: {
            borderRadius: 20,
            backgroundColor: colors.greyD,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 64
        },
        bottomText: {
            color: colors.dark,
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: -0.4,
            textAlign: 'center',
            fontFamily: fonts.semiBold
        }
    })
  
    return { styles }
}
