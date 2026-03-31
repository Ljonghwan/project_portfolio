import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, ScrollView, FlatList, Linking, Alert } from 'react-native';

import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Contacts from 'expo-contacts';

import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import ListText from '@/components/ListText';
import Loading from '@/components/Loading';

import Simple from '@/components/badges/Simple';

import { AnimatedBackground, AnimatedText } from '@/components/chatTheme/AnimatedColorComponents';

import { useConfig, useAlert, useUser } from '@/libs/store';

import images from '@/libs/images';
import chatImages from '@/libs/chatImages';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import chatStyle from '@/libs/chatStyle';
import routes from '@/libs/routes';
import rootStyle from '@/libs/rootStyle';

import { imageViewer, ToastMessage } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users, chatTheme }) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();
    const { configOptions } = useConfig();

    const { mbData } = useUser();
    const { openAlertFunc } = useAlert();

    const onPress = async () => {

        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    '연락처 권한 요청에 실패하였습니다.',
                    '연락처를 등록하시려면 연락처 권한을 설정해주세요.',
                    [
                        {text: '설정', onPress: () => Linking.openSettings()},
                        {text: '취소', onPress: () => {}},
                    ],
                );
                return;
            }

            const contact = {
                [Contacts.Fields.ContactType]: Contacts.ContactTypes.Person,
                [Contacts.Fields.PhoneNumbers]: [
                    {
                        label: '휴대전화',
                        number: item?.data?.hp, // 추가하려는 휴대폰 번호
                    },
                ],
            };

            // 연락처 추가 폼 띄우기
            await Contacts.presentFormAsync(null, contact, { cancelButtonTitle: '취소', isNew: true });
        } catch (error) {
            console.log('error', error);
            ToastMessage('잠시후 다시 시도해주세요.');
        }
    }


    const user = users?.find(v => v.idx === item?.data?.userIdx);
    const isMe = user?.idx === mbData?.idx;

    return (
        <View 
            style={[
                styles.root, 
                { 
                    backgroundColor: !item?.data?.status ? colors.greyA : isMe ? chatStyle?.chat_season_4?.finalWait : chatStyle?.chat_season_4?.finalWait2,
                    borderTopLeftRadius: isMe ? 20 : 0,
                    borderTopRightRadius: isMe ? 0 : 20,
                }
            ]}
        >
            <View style={[rootStyle.flex, { flex: 1, gap: 16, flexDirection: isMe ? 'row-reverse' : 'row' }]}>
                <Image source={user?.profile ? consts.s3Url + user?.profile : images.profile} style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: colors.greyD9 }} transition={200}/>
                <View style={{ flex: 1, gap: 10 }}>
                    <Text style={{...rootStyle.font(width <= 320 ? 14 : 16, !item?.data?.status ? colors.white : isMe ? colors.white : chatStyle?.chat_season_4?.primary, fonts.semiBold ), letterSpacing: -0.56, lineHeight: 20, textAlign: 'center' }}>{item?.message}</Text>
                    <Text style={{...rootStyle.font(width <= 320 ? 12 : 14, !item?.data?.status ? colors.white : isMe ? colors.white : chatStyle?.chat_season_4?.primary, fonts.regular ), letterSpacing: -0.36, lineHeight: 20, textAlign: 'center' }}>{item?.data?.text}</Text>
                </View>
            </View>


            {!isMe && item?.data?.hp && (
                <TouchableOpacity style={styles.button} activeOpacity={1} onPress={onPress}>
                    <Image source={images.search} style={rootStyle.default} transition={200} tintColor={chatStyle?.chat_season_4?.primary} />
                    <Text style={{...rootStyle.font(14, chatStyle?.chat_season_4?.primary, fonts.medium )}}>{user?.name}님의 연락처를 알 수 있어요!</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}


const useStyle = () => {

	const styles = StyleSheet.create({
        root: {
            paddingHorizontal: 12,
            paddingVertical: 16,
            borderRadius: 20,
            gap: 16,
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            borderRadius: 12,
            width: '100%',
            height: 40,
            backgroundColor: colors.white,
        },
     
     
      
	})

  	return { styles }
}