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


import { usePhotoPopup } from '@/libs/store';
import consts from '@/libs/consts';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Component({
    numRows = 5,
    padding = 0,
    max = 5,
    photo = [],
    setPhoto = () => { },
    addPress = () => { }
}) {

    const { width, height } = useSafeAreaFrame();
    const { styles } = useStyle();

    const { openPhotoFunc } = usePhotoPopup();

    const renderItem = ({ item, index }) => {

        const maxWidth = (width - (padding * 2) - ( 6 * (numRows - 1) )) / numRows;

        return (
            item === 'add' ? (
                <AnimatedTouchable 
                    layout={SequencedTransition} 
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={[styles.item, { maxWidth }]} 
                    activeOpacity={0.7} 
                    onPress={addPress}
                >
                    <Image source={images.add_black} style={rootStyle.default20} />
                    <Text style={{ ...rootStyle.font(10, colors.text7F8287, fonts.medium) }}>{photo?.length}/{max}</Text>
                </AnimatedTouchable>
            ) : (
                <AnimatedTouchable 
                    layout={SequencedTransition} 
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={[styles.item, { maxWidth }]} 
                    activeOpacity={0.7} 
                    onPress={() => {
                        addPress(index - 1)
                    }}
                >
                    <Image source={item?.uri || (consts.s3Url + item)} style={{ width: '100%', height: '100%' }} transition={100} />
                    <TouchableOpacity layout={SequencedTransition} style={{ position: 'absolute', top: 2, right: 2 }} activeOpacity={0.7} onPress={() => {
                        setPhoto(prev => prev?.filter((x, i) => i !== index - 1));
                    }}>
                        <Image source={images.delete_image} style={rootStyle.default20}/>
                    </TouchableOpacity>
                </AnimatedTouchable>
            )
            
        );
    };

    return (
        <View style={styles.list}>
            {/* <DraggableGrid
                numColumns={4}
                renderItem={renderItem}
                data={photo?.map((x, i) => ({ data: x, key: i}))}
                onDragRelease={(data) => {
                    setPhoto(data?.map(x => x?.data ));// need reset the props data sort after drag release
                }}
            /> */}
            <FlatList
                scrollEnabled={false} 
                data={["add", ...photo]}
                renderItem={renderItem}
                keyExtractor={(item, index) => index}
                numColumns={numRows}
                contentContainerStyle={{
                    gap: 6,
                }}
                columnWrapperStyle={{
                    columnGap: 6
                }}
            />

{/* 
            <TouchableOpacity style={[styles.item, { width: (width - (padding * 2) - (styles.list.gap * (numRows - 1))) / numRows }]} onPress={addPress}>
                <Image source={images.add_black} style={rootStyle.default20} />
                <Text style={{ ...rootStyle.font(10, colors.text7F8287, fonts.medium) }}>{photo?.length}/{max}</Text>
            </TouchableOpacity>

            {photo?.map((x, i) => {
                return (
                    <TouchableOpacity key={i} style={[styles.item, { width: (width - (padding * 2)) / numRows }]}>
                        <Image source={x?.uri || (consts.s3Url + x)} style={{ width: '100%', height: '100%' }} transition={100} />
                    </TouchableOpacity>
                )
            })} */}
        </View>
    );
}


const useStyle = () => {

    const insets = useSafeAreaInsets();
    const { width, height } = useSafeAreaFrame();
    const styles = StyleSheet.create({
        listContent: {
        },
        item: {
            flex: 1,
            aspectRatio: 1,
            backgroundColor: colors.eeeeef,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            overflow: 'hidden',
            maxWidth: '23%', // 4열: (100% - gap) / 4
        },
    })

    return { styles }
}
