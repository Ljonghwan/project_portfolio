import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard
} from 'react-native';

import Animated, { FadeIn, FadeOut, BounceOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import Text from '@/components/Text';
import TextArea from '@/components/TextArea';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';
import images from '@/libs/images';

import API from '@/libs/api';

import { useAlert, useConfig } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Component({
    roomIdx,
    user,
    onSubmit=()=>{}
}) {

    const insets = useSafeAreaInsets();
    const { styles } = useStyle();

    const { 
        closeAlertFunc
    } = useAlert();

    const { configOptions } = useConfig();

    const iref = useRef(null);

    const [ comment, setComment ] = useState("");

    const [ disabled, setDisabled ] = useState(true);
    const [ error, setError ] = useState({});
    const [ load, setLoad ] = useState(false);

    useEffect(() => {
        const inputReplace = comment?.replace(/\s+/g, '');
        setDisabled(!(comment?.length > 0 && inputReplace?.length > 0));
    }, [comment]);

    const submitFunc = async () => {
        Keyboard.dismiss();

        const inputReplace = comment?.replace(/\s+/g, '');
        if(!comment || inputReplace?.length < 1) {
            setError({...error, comment: '내용을 입력 해 주세요.'});
            return;
        }

        setLoad(true);

        const sender = {
            roomIdx: roomIdx,
            message: comment
        }

        console.log('sender', sender);
        const { data, error } = await API.post('/v1/chat/sendNote', sender);

        console.log('data', data, error);

        closeAlertFunc();
        
        if (error) {
            ToastMessage(error?.message);
            return;
        }

        ToastMessage(`마음이 전달되었어요.`);
        setLoad(false);
        onSubmit();
    }

    return (
        <View
            style={styles.root}
        >
            <View
                style={[
                    styles.container
                ]}
            >
                <Image source={images.chat_heart_send} style={{ width: 32, aspectRatio: 1, alignSelf: 'center', marginBottom: -5 }} tintColor={colors.primary}/>
                <View style={ styles.titleBox }>
                    {/* <Text style={styles.title}>{`${user?.name}님에게 마음을 담아\n전달할 내용을 적어주세요.`}</Text> */}
                    <Text style={styles.title}>{`상대방에게 마음을 담아\n전달할 내용을 적어주세요.`}</Text>
                </View>
                <View>
                    <TextArea 
                        iref={iref}
                        autoFocus={'fast'}
                        inputWrapStyle={{ height: 120 }}
                        inputStyle={{ fontSize: 14 }}
                        name={'comment'}
                        state={comment} 
                        setState={setComment} 
                        placeholder={`상대방에게 마지막 진심을 담은 쪽지를 보내보세요.`} 
                        returnKeyType={"done"}
                        onSubmitEditing={submitFunc}
                        blurOnSubmit={false}
                        maxLength={100}
                        multiline
                        numberOfLines={4}
                        error={error}
                        setError={setError}
                    />

                </View>
            </View>
            
            <View style={ styles.bottom }>
                <Button type={4} style={{ flex: 1 }} containerStyle={{ height: 52 }} textStyle={{ fontSize: 16 }} onPress={closeAlertFunc} >취소</Button>
                <Button type={1} style={{ flex: 1 }} containerStyle={{ height: 52 }} textStyle={{ fontSize: 16 }} onPress={submitFunc} disabled={disabled} load={load}>보내기</Button>
            </View>
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            gap: 18,
            backgroundColor: colors.white,
            borderRadius: 20,
            overflow: 'hidden',
            width: '100%',
            paddingHorizontal: 12,
            paddingVertical: 8

            // position: 'absolute',
            // top: -150 
            
        },
        container: {
            backgroundColor: colors.white,
            borderRadius: 20,
            gap: 24
        },
        titleBox: {
            gap: 4,
        },
        title: {
            color: colors.dark,
            fontSize: 18,
            lineHeight: 26,
            fontFamily: fonts.medium,
            letterSpacing: -0.5,
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
        listText: {
            color: colors.dark,
            fontSize: 16,
            lineHeight: 20,
            letterSpacing: -0.4,
            textAlign: 'center',
        },
        bottom: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
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
