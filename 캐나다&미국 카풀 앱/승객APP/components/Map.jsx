import { useState, useRef } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

import Text from '@/components/Text';
import Loading from '@/components/Loading';

import colors from '@/libs/colors';
import consts from '@/libs/consts';
import rootStyle from '@/libs/rootStyle';

import { useUser, useLang, useGps, useConfig } from '@/libs/store';

export default function Component({
    type = consts.mapType.finmap,
    uri=null,
    onHandleMessage=()=>{},
    initName,
    initAddr,
    initLat,
    initLng,
    pointerEvents='auto',
    onLoadEnd=()=>{},
}) {
	const insets = useSafeAreaInsets();

    const { country } = useLang();
    const { lat, lng } = useGps();
    const { configOptions } = useConfig();

    const webViewRef = useRef(null);

    const [ load, setLoad ] = useState(true);

    const onShouldStartLoadWithRequest = (event) => {    
        if (event.url.startsWith("http")) {
            Linking.openURL(event.url);
            return false;
        } else {
            return true;
        }
        
    }; 

    const handleMessage = (event) => {
        const message = event.nativeEvent.data;
        console.log('웹에서 받은 메시지:', message);
        onHandleMessage(JSON.parse(message));
        // 예: JSON.parse(message) 등으로 구조화 가능
    };

    const sendMessageToWeb = () => {
        const jsCode = `window.handleMessageFromApp && window.handleMessageFromApp('${JSON.stringify({lat: lat, lng: lng})}'); true;`;
        console.log('jsCode', jsCode);
        webViewRef.current.injectJavaScript(jsCode);
    };
    
    return (
        <View style={styles.container}>

            {/* {load && <Loading entering={false} style={{ backgroundColor: colors.white, paddingBottom: 0 }} color={colors.black} fixed /> } */}
            {/* <Text onPress={sendMessageToWeb}>{configOptions?.finMapUri}</Text> */}
            
            <WebView 
                ref={webViewRef}
                style={[styles.webview]}
                bounces={false} 
                pointerEvents={pointerEvents}
                containerStyle={{
                   
                }}
                originWhitelist={['http://*', 'https://*', 'intent://*']}
                decelerationRate={Platform.OS === 'ios' ? 'normal' : undefined} 
                // onShouldStartLoadWithRequest={event => {
                //     return onShouldStartLoadWithRequest(event);
                // }}
                onMessage={handleMessage}
                source={{ uri: uri || `${configOptions?.finMapUri}?lat=${initLat}&lng=${initLng}&lang=${country}` }} 
                onLoadEnd={() => { 
                    setTimeout(() => {
                        setLoad(false);
                        onLoadEnd();
                    }, 200)
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    bar: {
        borderTopColor: colors.sub_1,
        borderTopWidth: 1,
        marginHorizontal: rootStyle.side
    }
});
