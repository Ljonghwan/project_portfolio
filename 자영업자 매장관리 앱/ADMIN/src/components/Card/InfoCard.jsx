import CardBox from "./CardBox";
import styles from "./index.module.css"
import { numFormat } from "@/libs/utils";
export default function InfoCard(props) {
    const {
        style,
        title,
        message,
        persent=null,
        count=null,
    } = props;

    return <CardBox style={style}>
        <p className={styles.infobox_title}>{title}</p>
        <p className={styles.infobox_content}>{message}</p>
        {persent !== null && <p className={`${styles.infobox_persent} ${persent === 0 ? styles.zero : persent > 0 ? styles.add : styles.min}`}>{numFormat(Math.abs(persent))}</p>}
        {count !== null && <p className={`${styles.infobox_count} ${count === 0 ? styles.zero : count > 0 ? styles.add : styles.min}`}>{numFormat(Math.abs(count))}</p>}
    </CardBox>
}