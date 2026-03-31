import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity } from 'react-native';


const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export default function Component({
    style,
    imgStyle,
    img,
    onPress=()=>{},
    hitSlop
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
            <Image source={img} style={imgStyle} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    root: {

    },
});
