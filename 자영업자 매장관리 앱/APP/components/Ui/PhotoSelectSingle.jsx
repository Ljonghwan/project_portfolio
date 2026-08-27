import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';

import Animated, { useSharedValue, SequencedTransition, FadeIn, FadeOut } from 'react-native-reanimated';
import { Image, ImageBackground } from 'expo-image';

import { DraggableGrid } from 'react-native-draggable-grid';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';
import consts from '@/libs/consts';

import { usePhotoPopup } from '@/libs/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Component({
    photo = null,
    setPhoto = () => { }
}) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();

    const { openPhotoFunc } = usePhotoPopup();

    return (
        <View style={styles.root}>
            <TouchableOpacity style={styles.label} onPress={() => {
                openPhotoFunc({
                    maxFileSize: consts.maxImageSize,
                    setPhoto: (v) => {
                        if(!v) {
                            setPhoto(null);
                        } else {
                            setPhoto(v?.[0]);
                        }
                    },
                    deleteButton: photo ? true : false
                })
            }}>
                {photo ? (
                    <>
                        <Image source={photo?.uri || (consts.s3Url + photo)} style={{ width: '100%', height: '100%' }} />
                        <TouchableOpacity style={{ position: 'absolute', top: 2, right: 2 }} activeOpacity={0.7} onPress={() => {
                            setPhoto(null);
                        }}>
                            <Image source={images.delete_image} style={rootStyle.default20}/>
                        </TouchableOpacity>
                    </>
                ) : (
                    <Image source={images.add_black} style={rootStyle.default} />
                )}
            </TouchableOpacity>
        </View>
    );
}


const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();
    const styles = StyleSheet.create({
        label: {
            width: 100,
            aspectRatio: 1,
            backgroundColor: colors.fafafa,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
        }
    })

    return { styles }
}
