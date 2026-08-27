import styles from "./index.module.css"

export default function InfoBox(props) {

    const {
        key=null,
        title,
        required = false,
        content,
        borderTop = false,
        borderBottom = false,
        titleStyle,
    } = props;

    return <div key={key} className={styles.contain + (borderTop ? " " + styles.borderTop : "") + (borderBottom ? " " + styles.borderBottom : "")}>
        <div className={styles.infoTitle + (required ? " " + styles.required : "")} style={titleStyle}>
            {title}
        </div>
        <div className={styles.infoContents}>
            {content}
        </div>
    </div>
}