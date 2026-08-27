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

import { numFormat, ToastMessage } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users }) {

    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const [ load, setLoad ] = useState(false);

    const user = users?.find(v => v.idx === item?.data?.userIdx);

    return (
        <View style={[styles.buttonBox]}>

            <View style={styles.itemBallonSystem}>
                <Image source={user?.profile ? consts.s3Url + user?.profile : images.profile} style={styles.profile} />

                <Text style={[styles.itemBallonSystemText, { } ]}>
                    {`${user?.name || '알수없음'}님이 `}
                    <Text style={[styles.itemBallonSystemText, { fontFamily: fonts.bold, fontSize: 18 } ]}>{`TOP 플러팅`}</Text>
                    {`을 사용하셨습니다.\n그만큼 이 소개팅에 진심이신가 봐요. 😊`}
                </Text>

                <View style={[rootStyle.flex, { gap: 15 }]}>
                    <Image source={images.flirting} style={[rootStyle.flirting, { width: 29 }]}/>
                    <Text style={[styles.flirting, {  } ]}>플러팅 <Text style={[styles.flirting, { fontFamily: fonts.bold, color: colors.main6 }]}>{numFormat(item?.data?.flirting)}개</Text></Text>
                </View>

                <View style={styles.message}>
                    <Text style={[styles.messageText]}>{item?.data?.text}</Text>
                </View>

                <View>
                    <Text style={[styles.messageText, { textAlign: 'center' }]}>* 탑 플러팅은 만남 수락 시 전달 받으실 수 있습니다.</Text>
                    <Text style={[styles.messageText, { textAlign: 'center' }]}>* 만남 선택을 거부하시면 전달 받을 수 없습니다.</Text>
                </View>
            </View>

            {/* <Button type={3} style={{ flex: 1 }}>프로필 피드백 작성하기</Button> */}
        </View>
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

	const styles = StyleSheet.create({
        buttonBox: {
            maxWidth: '100%',
        },
       
        profile: {
            width: 80,
            aspectRatio: 1/1,
            borderRadius: 1000,
            backgroundColor: colors.placeholder
        },
        itemBallonSystem: {
            alignItems: 'center',
            padding: 16,
            backgroundColor: colors.system,
            borderRadius: 40,
            flex: 1,
            gap: 12,
        },
        itemBallonSystemText: {
            fontSize: 16,
            lineHeight: 22,
            letterSpacing: -0.4,
            color: colors.dark,
            fontFamily: fonts.semiBold,
            textAlign: 'center'
        },
        flirting: {
            fontSize: 24,
            letterSpacing: -0.4,
            color: colors.main5,
            fontFamily: fonts.semiBold,
            textAlign: 'center'
        },
        message: {
            width: '100%',
            borderRadius: 8,
            backgroundColor: colors.main4,
            padding: 8
        },
        messageText: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.grey6,
        },
        help: {
            fontSize: 14,
            lineHeight: 20,
            letterSpacing: -0.35,
            color: colors.grey6,
            textAlign: 'center'
        }
	})

  	return { styles }
}