import { PropsWithChildren, ReactElement } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';

import WebView from 'react-native-webview';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';

export default function Component({
    content,
    onLoad=()=>{},
    bottomInit=0
}) {

	const insets = useSafeAreaInsets();

    const bottom = bottomInit ? bottomInit : insets?.bottom;

    const onShouldStartLoadWithRequest = (event) => {    
        if (event.url.startsWith("http")) {
            Linking.openURL(event.url);
            return false;
        } else {
            return true;
        }
        
    }; 


    return (
        <View style={ [styles.container ]} >
            <WebView 
                style={styles.webview} 
                originWhitelist={['http://*', 'https://*', 'intent://*']}
                decelerationRate={Platform.OS === 'ios' ? 'normal' : undefined} 
                onShouldStartLoadWithRequest={event => {
                    return onShouldStartLoadWithRequest(event);
                }}
                source={{
                    html : `
                        <!DOCTYPE html>
                        <html lang="ko">
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=yes">

                                <script src="https://uicdn.toast.com/editor/latest/toastui-editor-viewer.js"></script>
                                <link rel="stylesheet" href="https://uicdn.toast.com/editor/latest/toastui-editor-viewer.min.css" />

                                <style>
                                    * {
                                        padding: 0;
                                        margin: 0;
                                        -webkit-user-select: none;
                                        -moz-user-select: none;
                                        -ms-user-select: none;
                                        user-select: none;
                                    }
                                    .content {
                                        padding: 0px ${rootStyle.side}px ${bottom}px ${rootStyle.side}px;
                                    }
                                </style>
                            </head>
                            <body>
                                <div id="content" class="content"></div>

                                <script>
                                    const Viewer = toastui.Editor;
                                    const viewer = new Viewer({
                                        el: document.querySelector('#content'),
                                        height: 'auto',
                                        initialValue: '${content}'
                                    });

                                    document.body.onselectstart = () => false;
                                    document.body.oncontextmenu = () => false;
                                </script>
                            </body>
                        </html>
                    `
                }} 
                onLoadEnd={onLoad}
                
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    webview: {
        flex: 1,
        backgroundColor: colors.white,
    }
});
