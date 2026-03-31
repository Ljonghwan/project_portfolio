import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Keyboard,
    StyleSheet,
    Pressable,
    View,
    useWindowDimensions,
} from 'react-native';

import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView
} from '@gorhom/bottom-sheet';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import rootStyle from '@/libs/rootStyle';

import { useAlertSheet } from '@/libs/store';
import { useBottomSheetModalBackHandler } from '@/libs/utils';

// component
import Text from '@/components/Text';
import Button from '@/components/Button';
import images from '@/libs/images';

export default function AlertSheet() {

    const { styles } = useStyle();

    const bottomSheetModalRef = useRef(null);
    
    const { 
        openAlertSheet, 
        theme,
        label,
        labelIcon,
        title,
        titleIcon,
        component,
        backgroundStyle,
        handleStyle,
        onCencle,
        onPress,
        onEnd,
        onCencleText,
        onPressText,
        onPressTheme,
        closeAlertFunc
    } = useAlertSheet();


    const [ load, setLoad ] = useState(false);

    useEffect(() => {

        if(openAlertSheet) {
            Keyboard.dismiss();

            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }

    }, [openAlertSheet, bottomSheetModalRef])

    const handleClose = () => {
        bottomSheetModalRef.current?.dismiss();
        if(onCencle) onCencle();
    }

    const handleSubmit = () => {
        bottomSheetModalRef.current?.dismiss();
        if(onPress) onPress();
    }

    const { handleSheetPositionChange } = useBottomSheetModalBackHandler(bottomSheetModalRef, () => handleClose() );

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
            handleStyle={[{ display: 'none' }, handleStyle ]}
            handleIndicatorStyle={{ width: 40, backgroundColor: colors.text9C9EA3 }}
            topInset={rootStyle.header.height}
            enableOverDrag={false}
            enableDynamicSizing={true}
            backgroundStyle={[{ backgroundColor: colors.white, borderRadius: 12 }, backgroundStyle ]}
            onDismiss={() => {
                closeAlertFunc();
                if(onEnd) onEnd();
            }}
            keyboardBlurBehavior={'restore'}
            enableBlurKeyboardOnGesture={true}
        >
            <View>
                {component ? (
                    <BottomSheetView style={styles.component}>
                        {component}
                    </BottomSheetView>
                ) : (
                    <BottomSheetView style={styles.main}>
                        
                        {label && (
                            <View style={[rootStyle.flex, { gap: 11 }]}>
                                {labelIcon && ( <Image source={labelIcon} style={rootStyle.default} /> )}
                                <Text style={styles.title} numberOfLines={1}>{label}</Text>
                            </View>
                        )}
                        {title && (
                            <View style={[rootStyle.flex, { gap: 11}]}>
                                {titleIcon && ( <Image source={titleIcon} style={rootStyle.default} /> )}
                                <Text style={styles.title} numberOfLines={2}>{title}</Text>
                            </View>
                        )}

                        <View style={styles.buttonBox}>

                            {onPressText && (
                                <Button onPress={handleSubmit}>{onPressText}</Button>
                            )}
                            {onCencleText && (
                                 <Button type={2} onPress={handleClose}>{onCencleText}</Button>
                            )}
                            
                        </View>
                    </BottomSheetView>
                )}
                
            </View>
        </BottomSheetModal>


    );
}

const useStyle = () => {

    const insets = useSafeAreaInsets();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
       
        modal: {
            margin: 0,
            justifyContent: 'flex-end',
        },
        main: {
            paddingHorizontal: rootStyle.side,
            paddingVertical: 37,
            paddingBottom: 37 + insets?.bottom,
        },
        component: {
            paddingTop: 20,
        },
        loading: {
        },
      
        label: {
            fontSize: 20,
            lineHeight: 32,
            color: '#fff',
            textAlign: 'center'
        },
        title: {
            fontSize: 20,
            lineHeight: 26,
            fontFamily: fonts.extraBold,
            color: colors.main,
            textAlign: 'center',
        },


        buttonBox: {
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            marginTop: 21
        },

        buttonOk: {
            height: 54,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#101010',
            borderRadius: 27,
            flex: 1
        },
        buttonTextOk: {
            color: '#fff',
            fontSize: 14
        },
       

    })
  
    return { styles }
}
