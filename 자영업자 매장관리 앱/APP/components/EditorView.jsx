import { useState } from 'react';
import { Linking, Platform, StyleSheet, View, Text } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

export default function Component({
    content,
    thumb,
    children
}) {
	const insets = useSafeAreaInsets();

    const bottom = 20 + insets?.bottom + (Platform.OS === 'ios' ? insets?.top : 0);

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
                containerStyle={{
                }}
                androidLayerType="software" 

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
                                    .root {
                                        padding: 14px ${rootStyle.side}px ${insets?.bottom}px ${rootStyle.side}px;
                                    }
                                    .thumb {
                                        width: 100%;
                                        aspect-ratio: 1/1;
                                        border-radius: 12px;
                                        object-fit: cover;
                                        margin-bottom: 30px;
                                    }
                                    img {
                                        max-width: 100% !important;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="root">
                                    ${thumb ? `<img src="${consts.s3Url + thumb}" class="thumb"/>` : ''}
                                    <div id="content" class="content"></div>
                                </div>

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
                onLoadEnd={() => {}}
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
