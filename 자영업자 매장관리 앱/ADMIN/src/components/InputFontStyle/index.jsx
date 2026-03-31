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

    const handlePress = ({ key, v }) => {
        if(value?.[key]) {
            const filteredProps = omit(value, [key]);
            setValue(filteredProps);
        } else {
            setValue({...value, [key]: v})
        }
    }

    return (
        <div className={styles.container}>
            <div className={`${styles.item} ${value?.fontWeight ? styles.active : ''}`} onClick={() => {
                handlePress({ key: 'fontWeight', v: 'bold' })
            }}>
                <img src={images.text_b} />
            </div>
            <div className={`${styles.item} ${value?.fontStyle ? styles.active : ''}`} onClick={() => {
                handlePress({ key: 'fontStyle', v: 'italic' })
            }}>
                <img src={images.text_i} />
            </div>
            <div className={`${styles.item} ${value?.textDecoration ? styles.active : ''}`} onClick={() => {
                handlePress({ key: 'textDecoration', v: 'underline' })
            }}>
                <img src={images.text_u} />
            </div>
        </div>
    )
}