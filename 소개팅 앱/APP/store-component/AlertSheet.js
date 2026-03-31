import React, {useRef, useState, useEffect, useCallback, useFocusEffect} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Keyboard,
} from 'react-native';

import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetModalProvider,
    BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import images from '@/libs/images';
import fonts from '@/libs/fonts';
import colors from '@/libs/colors';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import { useUser, useAlert } from '@/libs/store';
import { regPhone, useBottomSheetModalBackHandler } from '@/libs/utils';

// component
import Text from '@/components/Text';

export default function AlertSheet() {
    
    const insets = useSafeAreaInsets();

    const { styles } = useStyle();
    const { width, height } = useWindowDimensions();

    const bottomSheetModalRef = useRef(null);
    
    const { 
        openAlertSheet, 
        theme,
        label,
        title,
        component,
        onCencle,
        onPress,
        onEnd,
        onCencleText,
        onPressText,
        onPressTheme,
        closeAlertFunc,
        detached
    } = useAlert();


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
            handleStyle={{ display: 'none' }}
            topInset={rootStyle.header.height}
            enableOverDrag={false}
            enableDynamicSizing={true}
            backgroundStyle={{ backgroundColor: detached ? 'transparent' : colors.white, borderRadius: 20 }}
            // set `detached` to true
            detached={detached}
            bottomInset={detached ? (insets?.bottom + 12) : 0}
            style={{ marginHorizontal: detached ? 12 : 0 }}
            onDismiss={() => {
                closeAlertFunc();
            }}
            
        >
            {component ? (
                <BottomSheetView style={[styles.component, { gap: detached ? 8 : 0 }]}>
                    {component}
                </BottomSheetView>
            ) : (
                <BottomSheetView style={styles.main}>
                    
                    {label && <Text style={styles.label} font={fonts.notosansBold}>{label}</Text>}
                    {title && <Text style={styles.title} >{title}</Text>}

                    <View style={styles.buttonBox}>
                        <TouchableOpacity style={styles.buttonOk} onPress={() => {handleClose(); }}>
                            <Text style={[styles.buttonTextOk ]} font={fonts.notosansMedium}>{onPressText}</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>
            )}
                
        </BottomSheetModal>


    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    
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
        loading: {
        },
      
        label: {
            fontSize: 20,
            lineHeight: 32,
            color: '#fff',
            textAlign: 'center'
        },
        title: {
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.4)',
            textAlign: 'center'
        },


        buttonBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            marginTop: 24
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
