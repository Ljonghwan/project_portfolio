import { PropsWithChildren, ReactElement } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image, useImage } from 'expo-image';

import Text from '@/components/Text';

export default function Component({
    style,
    source
}) {

    const image = useImage(source);

    return (
        <>
            <Image
                source={source}
                style={[styles.image, style, { aspectRatio: image ? image.width / image.height : 1 }]}
                contentFit="contain"
            />
        </>
    );
}

const styles = StyleSheet.create({
    image: {
        width: '100%',
        maxHeight: 1600
    },
});
