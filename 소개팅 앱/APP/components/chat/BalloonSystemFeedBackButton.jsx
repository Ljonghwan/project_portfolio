import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Button from '@/components/Button';

import Simple from '@/components/badges/Simple';

import { useConfig, useEtc } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, user }) {

    const { styles } = useStyle();
    const { configOptions } = useConfig();


    const [ load, setLoad ] = useState(false);

    const onPress = async () => {
        // 프로필 읽음 여부 확인

        let sender = {
            roomIdx: item?.roomIdx
        }
        
        const { data, error } = await API.post('/v1/capsule/checkFeedback', sender);

        if(error) {
            ToastMessage(error?.message);
            return;
        }

        const type = consts.chatWriteOptions?.find(x => x.value === 1);

        router.navigate({
            pathname: routes.chatWriteForm,
            params: {
                roomIdx: item?.roomIdx,
                type: type?.apiType,
                title: type?.title
            }
        })
    }

    return (
        <View style={[styles.buttonBox]}>
            <Pressable 
                style={[
                    styles.button
                ]}
                onPress={onPress} 
                disabled={load}
            >
                {({pressed}) => (
                    <>
                        <Image source={images.pen_white} style={rootStyle.default}/>
                        <Text style={[ styles.buttonText, pressed && { opacity: 0.5 } ]}>프로필 피드백 작성하기</Text>
                    </>
                )}
            </Pressable>

            {/* <Button type={3} style={{ flex: 1 }}>프로필 피드백 작성하기</Button> */}
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
        buttonBox: {
            maxWidth: '100%',
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8 
        },
        button: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: "center",
            alignItems: "center",
            gap: 4,
            borderRadius: 8,
            backgroundColor: colors.main,
        },
        buttonText: {
            color: colors.white,
            textAlign: "center",
            fontFamily: fonts.semiBold,
            fontSize: 16,
            lineHeight: 52,
        },
        
	})

  	return { styles }
}