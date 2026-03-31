import React, { useId } from 'react';
import styles from './index.module.css';

import { omit } from 'lodash';

import images from '@/libs/images';

export default function CheckBox(props) {
    const {
        value,
        setValue
    } = props;

    const uniqKey = useId();

    const handlePress = (v) => {
        setValue({...value, textAlign: v})
    }

    return (
        <div className={styles.container}>
            <div className={`${styles.item} ${value?.textAlign === 'left' ? styles.active : ''}`} onClick={() => {
                handlePress('left')
            }}>
                <img src={images.text_left} />
            </div>
            <div className={`${styles.item} ${value?.textAlign === 'center' ? styles.active : ''}`} onClick={() => {
                handlePress('center')
            }}>
                <img src={images.text_center} />
            </div>
            <div className={`${styles.item} ${value?.textAlign === 'right' ? styles.active : ''}`} onClick={() => {
                handlePress('right')
            }}>
                <img src={images.text_right} />
            </div>
        </div>
    )
}