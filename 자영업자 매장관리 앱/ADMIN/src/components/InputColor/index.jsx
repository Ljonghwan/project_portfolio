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

    return (
        <div className={styles.container}>
            <input
                id={uniqKey}
                type={'color'}
                onChange={e => setValue(e?.target?.value)}
                value={value}
            />
            <label for={uniqKey}>{value || ''}</label>
        </div>
    )
}