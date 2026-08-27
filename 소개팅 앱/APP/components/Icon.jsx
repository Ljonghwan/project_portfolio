import { PropsWithChildren, ReactElement } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

import colors from '@/libs/colors';

const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export default function Component({
    style,
    imgStyle,
    img,
    onPress=()=>{},
    hitSlop,
    tintColor
}) {

    return (
        <TouchableOpacity
            style={[
                styles.root,
                style
            ]}
            onPress={onPress}
            hitSlop={hitSlop}
        >
            <Image source={img} style={imgStyle} tintColor={tintColor} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    root: {

    },
});
