
/**
 * 텍스트 프로파일
 * 
 * @param {{
 * text:string;
 * style:React.CSSProperties
 * }} props 
 * @returns JSX.Element
 */
export default function TextProfile(props) {
    const {
        text = "",
        style
    } = props

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            background: "#424040",
            borderRadius: 100
        }}>
            <p style={{
                fontSize: 16,
                // lineHeight: 1.2,
                fontWeight: 400,
                color: "#FFF",
            }}>
                {text.charAt(0)}
            </p>
        </div>
    )
}