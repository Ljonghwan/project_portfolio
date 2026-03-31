import { useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Pressable, TouchableWithoutFeedback, useWindowDimensions } from 'react-native';
import { Image, useImage } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '@/components/Text';

import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';

export default function Component({
	text="",
	color="#000000",
	style={},
	align="left",
}) {

    const { styles } = useStyle();

	const source = consts.apiUrl + `/textBlur?color=${color?.replace('#', '')}&text=${encodeURIComponent(text)}&align=${align}&v=8`;

    const image = useImage(source, { onError: () => {} });
    
    return (
        <>
            <View style={[styles.root, style, {  }]}>
                <Image 
                        source={source} 
                        style={{ width: '100%', aspectRatio: image ? image.width / image.height : 4, opacity: 0.7 }}
                        contentFit="contain"
                />
			   {/* <View style={{...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center'}}>
					<Text style={{...rootStyle.font(14, color, fonts.regular), lineHeight: 20 }}>{image?.width} / {image?.height}</Text>
			   </View> */}
            </View>
        </>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
        
    const styles = StyleSheet.create({
        root: {
        },

    });


  	return { styles }
}
