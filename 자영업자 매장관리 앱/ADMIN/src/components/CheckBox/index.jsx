import React, { useId } from 'react';
import styles from './index.module.css';

export default function CheckBox(props) {
    const {
        label = "",
        checked,
        onChange = (checked) => { },
        type
    } = props;

    const uniqKey = useId();

    return <div className={styles.check_box}>
        <input id={uniqKey} className={`checkbox${type ? type : ''}`} type='checkbox' checked={checked} onChange={(e) => {
            console.log(e.target.checked)
            onChange(e.target.checked)
        }} />
        <label htmlFor={uniqKey} >
            {label && <p className={styles.label_text}>{label}</p>}
        </label>

    </div>
}