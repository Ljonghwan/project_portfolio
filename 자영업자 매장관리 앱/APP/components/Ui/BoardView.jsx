import { useState, useEffect, useRef } from 'react';
import { Linking, Platform, StyleSheet, View, Text } from 'react-native';

import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import WebView from 'react-native-webview';
import {
    RichEditor,
} from 'react-native-pell-rich-editor';
import RenderHtml, { IMGElement } from 'react-native-render-html';

import colors from '@/libs/colors';
import rootStyle from '@/libs/rootStyle';
import { stripHtml } from '@/libs/utils';

const tagsStyles = {
    div: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        lineHeight: 20,
        fontSize: 14
    },
    
};

const renderers = {
    img: ({ tnode, ...props }) => {
        return (
            <Image
                source={{ uri: tnode.attributes.src }}
                style={{
                    width: '33.33%',
                    aspectRatio: 1/1
                }}
            />
        );
    }
};
export default function Component({ content }) {

    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();

    const [webViewHeight, setWebViewHeight] = useState(100);
    const richText = useRef(null);

    useEffect(() => {
        console.log('content', content);
        console.log('stripHtml content', stripHtml(content));
    }, [content])
    return (
        <View style={styles.container}>
            {/* <Text>Height: {webViewHeight} ?12345</Text> */}
            <RenderHtml
                contentWidth={width}
                source={{ html: content }}
                renderers={renderers}
                tagsStyles={tagsStyles}
                enableExperimentalMarginCollapsing={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 4
    },
});