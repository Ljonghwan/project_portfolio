import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, useWindowDimensions, Platform, Linking, Alert } from 'react-native';

import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Contacts from 'expo-contacts';
import dayjs from "dayjs";
import 'dayjs/locale/ko';

import Text from '@/components/Text';
import Button from '@/components/Button';

import Simple from '@/components/badges/Simple';

import { useAlert, useEtc, useUser } from '@/libs/store';

import images from '@/libs/images';
import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import consts from '@/libs/consts';
import routes from '@/libs/routes';
import chatStyle from '@/libs/chatStyle';
import rootStyle from '@/libs/rootStyle';

import API from '@/libs/api';

import { ToastMessage, hpHypen } from '@/libs/utils';

dayjs.locale('ko');

export default function Component({ item, users, room, chatTheme }) {

    const { styles } = useStyle();

    const { openAlertFunc } = useAlert();

    const { mbData } = useUser();
    const [load, setLoad] = useState(false);

    const onPress = async () => {
        if(room?.user?.status !== 1) {
            ToastMessage(`상대방의 연락처를 확인할 수 없습니다.`);
            return;
        }
        
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
                [Contacts.Fields.FirstName]: item?.data?.name, // 이름
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
                    backgroundColor: isMe ? chatStyle?.chat_season_5?.reviewWait : chatStyle?.chat_season_5?.reviewWait2,
                    borderTopLeftRadius: isMe ? 20 : 0,
                    borderTopRightRadius: isMe ? 0 : 20,
                }
            ]}
        >
            <View style={[
                styles.top, 
                {
                    flexDirection: isMe ? 'row-reverse' : 'row',
                }
            ]}>
                <Image source={user?.profile ? consts.s3Url + user?.profile : images.profile} style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: colors.greyD9 }} transition={200}/>

                <View style={{ flex: 1, gap: 10 }}>
                    <Text style={{...rootStyle.font(16, isMe ? colors.black : colors.white, fonts.semiBold ), letterSpacing: -0.35, lineHeight: 20, textAlign: 'center' }}>{item?.message}</Text>
                    <Text style={{...rootStyle.font(14, isMe ? colors.black : colors.white, fonts.regular ), letterSpacing: -0.35, lineHeight: 20, textAlign: 'center' }}>{item?.data?.text}</Text>
                </View>
            </View>

            <TouchableOpacity style={[styles.button, { backgroundColor: isMe ? chatStyle?.chat_season_5?.reviewHpButton : chatStyle?.chat_season_5?.reviewHpButton2 }]} activeOpacity={0.7} onPress={() => {
                if(!isMe) onPress();
            }}>
                <Text style={{...rootStyle.font(14, isMe ? colors.black : chatStyle?.chat_season_5?.primary, fonts.medium), lineHeight: 20, textAlign: 'center' }}>
                    {`"${item?.data?.name}" 님의 연락처`}
                </Text>
                <Text style={{...rootStyle.font(14, isMe ? colors.black : chatStyle?.chat_season_5?.primary, fonts.medium), lineHeight: 20, textAlign: 'center' }}>
                    {`${hpHypen(item?.data?.hp)}`}
                </Text>
            </TouchableOpacity>
            
        </View>
        
    );
}


const useStyle = () => {

    const { width, height } = useWindowDimensions();

    const styles = StyleSheet.create({
        root: {
            paddingHorizontal: 12,
            paddingVertical: 16,
            borderRadius: 20,
            gap: 16
        },
        top: {
            gap: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },

        button: {
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            width: '100%',
            height: 56,
            backgroundColor: colors.white,
        },
    })

    return { styles }
}