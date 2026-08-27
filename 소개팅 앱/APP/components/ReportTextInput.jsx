import React, {useRef, useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    useWindowDimensions,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';

import Animated, { FadeIn, FadeOut, BounceOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '@/components/Text';
import TextArea from '@/components/TextArea';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import fonts from '@/libs/fonts';

import { useAlert, useConfig } from '@/libs/store';

import { ToastMessage } from '@/libs/utils';

export default function Component({
    item,
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
    const [ error, setError ] = useState({});

    const submitFunc = () => {
        const inputReplace = comment?.replace(/\s+/g, '');
        if(!comment || inputReplace?.length < 1) {
            setError({...error, comment: '내용을 입력 해 주세요.'});
            // ToastMessage('내용을 입력 해 주세요.');
            return;
        }

        onSubmit({ optionIdx: item?.idx, desc: comment });
        closeAlertFunc();
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
                <View style={ styles.titleBox }>
                    <Text style={styles.title}>신고 사유 작성</Text>
                </View>
                <View>
                    <TextArea 
                        iref={iref}
                        autoFocus={'fast'}
                        inputStyle={{ fontSize: 14 }}
                        name={'comment'}
                        state={comment} 
                        setState={setComment} 
                        placeholder={`내용을 입력하세요.`} 
                        returnKeyType={"done"}
                        onSubmitEditing={submitFunc}
                        blurOnSubmit={false}
                        maxLength={255}
                        multiline
                        error={error}
                        setError={setError}
                    />

                </View>
            </View>
            <View style={ styles.bottom }>
                <Button type={4} style={{ flex: 1 }} containerStyle={{ height: 52 }} textStyle={{ fontSize: 16 }} onPress={closeAlertFunc} >취소</Button>
                <Button type={1} style={{ flex: 1 }} containerStyle={{ height: 52 }} textStyle={{ fontSize: 16 }} onPress={submitFunc}>신고하기</Button>
            </View>
        </View>
    );
}

const useStyle = () => {

    const { width, height } = useWindowDimensions();
    
    // Dimensions.get('window').width

    const styles = StyleSheet.create({
        root: {
            gap: 24,
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
            fontFamily: fonts.medium,
            letterSpacing: -0.5
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
