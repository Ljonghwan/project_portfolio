import styles from "./index.module.css"

export default function CardBox(props) {
    const {
        style,
        className,
        children
    } = props;
    return <div
        style={style}
        className={`${styles.card_contain} ${className || ""}`}
    >
        {children}
    </div>
}