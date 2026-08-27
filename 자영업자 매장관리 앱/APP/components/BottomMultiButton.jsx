import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets, useSafeAreaFrame } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import Loading from '@/components/Loading';
import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';
import images from '@/libs/images';
import rootStyle from '@/libs/rootStyle';


const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function Component({
    children,
    style,
    pointerEvents,
    bottom = true,
}) {

    const insets = useSafeAreaInsets();
    const { width } = useSafeAreaFrame();

    return (
        <KeyboardStickyView
            style={[
                { width: '100%', overflow: 'hidden' },
                style,
                bottom && {
                    paddingBottom: insets?.bottom + 20,
                    paddingHorizontal: width <= 330 ? 20 : 35,
                    position: 'absolute',
                    bottom: 0,
                },
            ]}
            pointerEvents={pointerEvents}
            offset={{ closed: 0, opened: (insets?.bottom + 20) - 15 }}
            enabled={bottom}
        >
            {bottom && (
                <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,1)' ]} // 위쪽은 진하게, 아래는 투명
                    style={styles.gradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.9 }}
                />
            )}

            <View style={[ rootStyle.flex, { gap: 4, justifyContent: 'space-between' }]}>
                {children}
            </View>
        </KeyboardStickyView>
    );
}

const styles = StyleSheet.create({
    gradient: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        
    },
    
    
});
