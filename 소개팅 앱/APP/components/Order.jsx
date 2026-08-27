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

import Text from '@/components/Text';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';

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
            backgroundStyle={{ backgroundColor: 'transperate', borderRadius: 20 }}
            detached={true}
            bottomInset={insets?.bottom || 20}
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
                            {/* <View style={ styles.titleBox }>
                                <Text style={styles.title}>정렬</Text>
                                <Text style={styles.subTitle}>신고 사유를 선택해 주세요.</Text>
                            </View> */}
                            <View>
                                {consts?.orderOptions?.map((x, i) => {
                                    return (
                                        <TouchableOpacity key={i} style={[styles.list, value === x?.value && styles.listActive ]} onPress={() => {
                                            onSubmit(x?.value)
                                        }}>
                                            <Text style={[styles.listText, value === x?.value && styles.listTextActive]}>{x?.title}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                                
                            </View>
                        
                        </View>
                        <View style={ styles.bottom }>
                            <TouchableOpacity style={[rootStyle.flex, { flex: 1, height: '100%' }]} onPress={handleClose}>
                                <Text style={styles.bottomText}>취소</Text>
                            </TouchableOpacity>
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
            height: 44,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.white
        },
        listActive: {
            borderColor: colors.main
        },
        listText: {
            color: colors.grey9,
            fontSize: 16,
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
