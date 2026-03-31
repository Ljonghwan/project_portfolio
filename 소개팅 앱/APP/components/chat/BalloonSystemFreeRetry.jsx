import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Image } from 'expo-image';
import { router } from 'expo-router';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Button from '@/components/Button';

import Simple from '@/components/badges/Simple';

import { useConfig, useAlert } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, isLast, leaveAlert }) {

    const { styles } = useStyle();
    const { openAlertFunc } = useAlert();

    const [ load, setLoad ] = useState(false);

    const onPress = async () => {
       
        const type = consts.chatWriteOptions?.find(x => x.value === 4);
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
        <View style={styles.itemBallonSystem}>
            <Text style={styles.itemBallonSystemText}>{item?.message}</Text>

            {isLast && (
                <View style={styles.buttonBox}>
                    <Button type={10} style={{ flex: 1 }} onPress={leaveAlert}>대화 종료</Button>
                    <Button type={9} style={{ flex: 1 }} onPress={onPress}>재요청</Button>
                </View>
            )}
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
        item: {
            flex: 1,
        },
        itemBallonSystem: {
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: colors.system,
            borderRadius: 12,
            flex: 1,
            gap: 12
        },
        itemBallonSystemText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.dark,
            textAlign: 'center'
        },
        buttonBox: {
            maxWidth: '80%',
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8 
        }
        
	})

  	return { styles }
}