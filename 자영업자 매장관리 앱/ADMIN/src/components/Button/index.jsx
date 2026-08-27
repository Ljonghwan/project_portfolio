import styles from './index.module.css';

export default function Component({
    style,
    fixed = true
}) {

    const [email, setEmail] = useState("")

    useEffect(() => {


    }, [])

    return (
        <div className={`${styles.pop_contain}`}>

            < p > 비밀번호 찾기</ p>
            <p>가입 시 입력한 이메일 주소를 입력해주세요.</p>
            <p>임시 비밀번호를 발송해드립니다.</p>
            <p>이메일</p>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <Input className="input_text" type="text" style={{ marginBottom: 10 }} placeholder="아이디를 입력해주세요." name="email" value={email} setValue={setEmail} autoComplete={"one-time-code"} />
            </div>

            <button className='btn2'>button</button>
        </div>
    )
}