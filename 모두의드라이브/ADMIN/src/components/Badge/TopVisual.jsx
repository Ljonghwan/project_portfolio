import images from "@/libs/images";
import consts from "@/libs/consts";

import styles from './index.module.css';

export default function Component() {

    return (
        <div className={styles.container} >
            <img src={images.crown} alt={consts.imgAlt} className={styles.img} />
            <span className={styles.title}>탑비주얼</span>
        </div>
    )    
}