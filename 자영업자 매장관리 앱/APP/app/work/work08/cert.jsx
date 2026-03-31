import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Keyboard, TouchableOpacity, Linking, Platform, Alert, Modal } from 'react-native';

import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import dayjs from 'dayjs';

import Pdf from 'react-native-pdf';
import SignatureCanvas from 'react-native-signature-canvas';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Loading from '@/components/Loading';
import EditorView from '@/components/EditorView';
import Button from '@/components/Button';

import colors from '@/libs/colors';
import routes from '@/libs/routes';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';
import fonts from '@/libs/fonts';

import API from '@/libs/api';

import { useUser, useStore, useAlert, useLoader, useConfig } from '@/libs/store';

import { ToastMessage, numFormat, hpHypen, hpHypenRemove } from '@/libs/utils';


function SignatureCanvasComponent({ onClose, onSubmit }) {

    const { styles } = useStyle();

    const router = useRouter();
    const { idx } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const { mbData } = useUser();
    const { store } = useStore();
    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();

    const [signature, setSignature] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [disabled, setDisabled] = useState(false);
    const [pdfUri, setPdfUri] = useState(null);

    const ref = useRef();

    useEffect(() => {
        setDisabled(!(signature));
    }, [signature])

    const handleSignature = async (signature) => {
        await onSubmit(signature);
    };

    const handleEmpty = () => {
        console.log('Signature is empty');
    };

    const handleClear = () => {
        console.log('Signature cleared');
    };

    const handleError = (error) => {
        console.error('Signature pad error:', error);
    };

    const handleEnd = async () => {
        await ref.current?.readSignature();
    };
    const handleLoadEnd = () => {
        console.log('Signature canvas loaded');

        setTimeout(() => {
            setIsLoading(false);
        }, consts.apiDelayLong);
    };


    return (
        <View style={{ flex: 1, backgroundColor: colors.gray }}>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: '100%', aspectRatio: 4 / 3 }}>
                    {isLoading && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white, paddingBottom: 0 }} fixed />)}
                    <SignatureCanvas
                        ref={ref}
                        // onEnd={handleEnd}
                        onOK={handleSignature}
                        onEmpty={handleEmpty}
                        onClear={handleClear}
                        onError={handleError}
                        onLoadEnd={handleLoadEnd}
                        autoClear={false}
                        descriptionText="Sign here"
                        penColor="#000000"
                        minWidth={3}
                        maxWidth={5}
                        overlayHeight={300}
                        webviewProps={{
                            // Custom WebView optimization
                            cacheEnabled: true,
                            androidLayerType: "hardware",
                        }}
                        backgroundColor='transparent'
                    />
                </View>
            </View>
            <View style={[rootStyle.flex, { paddingBottom: insets.bottom + 20, paddingHorizontal: 20, gap: 20 }]}>
                <TouchableOpacity onPress={onClose} hitSlop={20}>
                    <Image source={images.exit} style={rootStyle.default} />
                </TouchableOpacity>
                <Button
                    style={{ flex: 1 }}
                    onPress={() => {
                        handleEnd();
                    }}
                >
                    서명완료
                </Button>
            </View>
        </View>

    )
}




export default function Page() {

    const { styles } = useStyle();

    const router = useRouter();
    const { idx } = useLocalSearchParams();

    const insets = useSafeAreaInsets();

    const { mbData } = useUser();
    const { store } = useStore();
    const { configOptions } = useConfig();
    const { openAlertFunc } = useAlert();
    const { openLoader, closeLoader } = useLoader();


    const [item, setItem] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [pdfUri, setPdfUri] = useState(null);

    const [signature, setSignature] = useState(null);
    const [visible, setVisible] = useState(false);

    const [initLoad, setInitLoad] = useState(true); // 최초 페이지 진입 로딩
    const [load, setLoad] = useState(true);


    useEffect(() => {
        dataFunc();
    }, [idx])


    const dataFunc = async () => {

        const sender = {
            idx: idx,
        }
        console.log('sender', sender);
        const { data, error } = await API.post('/v1/work08/get', sender);

        if (error) {
            ToastMessage(error?.message);
            router.back();
            return;
        }

        setItem(data);
        setPreviewUrl(data?.file);
       
    }


    const testFunc = async (signature) => {
        openLoader();

        const sender = {
            idx: item?.idx,
            signature: signature,
        }

        const { data, error } = await API.post('/v1/work08/sign', sender);

        setTimeout(() => {

            closeLoader();

            if (error) {
                ToastMessage(error?.message);
                return;
            }
            ToastMessage('서명이 완료되었어요.');
            dataFunc();

        }, consts.apiDelay)

    }


    const downloadPdf = async () => {
        try {
            openLoader();

            const sender = {
                idx: idx,
            }
            const { data, error } = await API.post('/v1/work08/get', sender);
    
            if (error) throw new Error(error?.message);
    
            if (!data?.file) throw new Error('previewUrl is not found');

            const fileName = `${store?.name}_${item?.staff?.name}_근로계약서_${dayjs().format('YYYYMMDD')}.pdf`;
            // 캐시 디렉토리에 다운로드
            const fileUri = FileSystem.cacheDirectory + fileName;

            const downloadResult = await FileSystem.downloadAsync(
                data?.file,
                fileUri
            );

            if (downloadResult.status !== 200) {
                throw new Error('다운로드 실패');
            }

            // 공유
            await Sharing.shareAsync(downloadResult.uri, {
                mimeType: 'application/pdf',
                dialogTitle: '근로계약서 출력하기'
            });

        } catch (e) {
            console.log("downloadPdf error", e);
            Alert.alert("다운로드 실패");
        } finally {
            closeLoader();
        }
    };

    const header = {
        title: '근로계약서',
        right: {
            icon: 'exit',
            onPress: () => router.back()
        },
    };

    return (
        <Layout header={header}>

            {initLoad && (<Loading entering={false} color={colors.black} style={{ backgroundColor: colors.white }} fixed />)}

            {previewUrl && (
                <View style={{ flex: 1 }}>
                    <Pdf
                        source={{ uri: previewUrl }}
                        trustAllCerts={false}
                        style={{ flex: 1 }}
                        onError={(error) => console.log('PDF error:', error)}
                        onLoadComplete={() => {
                            setTimeout(() => {
                                setInitLoad(false);
                            }, consts.apiDelay);
                        }}
                    />
                </View>
            )}


            <Button bottom onPress={() => {
                if (item?.staff?.cert === 1) {
                    setVisible(true);
                } else {
                    downloadPdf();
                }

            }}>{item?.staff?.cert === 1 ? '서명하기' : '출력하기'}</Button>


            <Modal
                visible={visible}
                animationType={'fade'}
                onRequestClose={() => setVisible(false)}
                transparent
                statusBarTranslucent={true}
                navigationBarTranslucent={true}
            >
                <SignatureCanvasComponent onClose={() => setVisible(false)} onSubmit={(signature) => {
                    console.log('서명 완료');
                    testFunc(signature);
                    setVisible(false);
                }} />
            </Modal>

        </Layout>
    )
}


const useStyle = () => {

    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        root: {
            flex: 1,
            padding: 20,
            gap: 12,
        },
        container: {
            flex: 1
        },
        webview: {
            backgroundColor: colors.white,
            flex: 1
        },
        title: {
            fontSize: 20,
            fontFamily: fonts.bold,
        },
        singnatureContainer: {
            backgroundColor: 'transparent',
            height: 300,
        }
    })

    return { styles }
}