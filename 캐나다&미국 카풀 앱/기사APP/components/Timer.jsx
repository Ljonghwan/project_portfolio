import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    View
} from 'react-native';

import Text from '@/components/Text';

import colors from '@/libs/colors';
import fonts from '@/libs/fonts';

export default function Component({ timeOut }) {

    const [min, setMin] = useState("01");
    const [sec, setSec] = useState("00");
    const time = useRef(60);
    const timerId = useRef(null);

    useEffect(() => {

        timerId.current = setInterval(() => {
            setMin(parseInt(time.current / 60) < 10 ? "0"+parseInt(time.current / 60) : parseInt(time.current / 60));
            setSec(time.current % 60 < 10 ? "0"+time.current % 60 : time.current % 60);
            time.current -= 1;
        }, 1000);

        return () => clearInterval(timerId.current);
    }, []);

    useEffect(() => {
        // 만약 타임 아웃이 발생했을 경우
        if (time.current <= 0) {
            setTimeout(() => {
                clearInterval(timerId.current);
                // dispatch event
                timeOut(false);
            }, 1000)
        }
    }, [sec]);

    return (
        <Text style={styles.title}>{min}:{sec}</Text>
    );
}

const styles = StyleSheet.create({
    
    title: {
        color: colors.taseta,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 18,
    },
});
  