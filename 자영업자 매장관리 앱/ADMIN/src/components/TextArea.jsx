import React, { useEffect, useState, useRef } from 'react';

export default function TextArea(props) {

    const { 
        className, 
        placeholder, 
        type, 
        name, 
        maxlength, 
        value, 
        setValue, 
        valid, 
        label, 
        required,
        error, 
        setError=()=>console.log(""),
        success, 
        readOnly, 
        onBlur,
        onChange,
        index,
        withButton, 
        withButtonPress,
        withText,
        timer=false,
        timerState,
        msg,
        style,
        size,
        height
    } = props;

    const textAreaRef = useRef(null);

    const [t, setT] = useState(timer);
    const [f, setF] = useState(false);

    const [address, setAddress] = useState(''); // 주소
    const [addressDetail, setAddressDetail] = useState(''); // 상세주소
    
    const [isOpenPost, setIsOpenPost] = useState(false);

    useEffect(() => {
        if (textAreaRef && size === 'no_style') {
            // We need to reset the height momentarily to get the correct scrollHeight for the textarea
            textAreaRef.current.style.height = "0px";
            const scrollHeight = textAreaRef.current?.scrollHeight;

            // We then set the height directly, outside of the render loop
            // Trying to set this with state or a ref will product an incorrect value.
            textAreaRef.current.style.height = (scrollHeight < 1 ? 23 : scrollHeight) + "px";
        }
    }, [textAreaRef, value]);

    useEffect(() => {
        setT(timer);
    }, [timer]);

    const handleChange = (e) => {

        if(setError) setError("");
        
        if(onChange) {
             onChange((prev) => { 
                return (
                    {...prev, [e.target.name]: e.target.value}
                )
            });
            
        } else {
            setValue(e.target.value);
        }
    };

    const handleBlur = () => {
        setF(false);
    };
    const handleFocus = () => {
        
        setF(true);

        if(withButton === "주소찾기") {
            setIsOpenPost(true);
        }
    };
    const handleClick = () => {
        if(withButton === "주소찾기") {
            setIsOpenPost(true);
        } else if(withButton === "지역선택") {
            withButtonPress();
        }
    };
    
    const withButtonFunc = () => {
        if(withButton === '복사') {
            navigator.clipboard.writeText(value);
        } else if(withButton === "주소찾기") {
            setIsOpenPost(true);
        }
    }

    const onCompletePost = (data) => {
        let fullAddr = data.address;
        let extraAddr = '';

        if (data.addressType === 'R') {
            if (data.bname !== '') {
                extraAddr += data.bname;
            }
            if (data.buildingName !== '') {
                extraAddr += extraAddr !== '' ? `, ${data.buildingName}` : data.buildingName;
            }
            fullAddr += extraAddr !== '' ? ` (${extraAddr})` : '';
        }

        setValue(data.address);
        setAddress(data.zonecode);
        setAddressDetail(fullAddr);
        setIsOpenPost(false);
    };

    const postBoxStyle = {
        display: 'block',
        position: 'relative',
        width: '100%',
        border: '1px solid #000',
    };
    const postCodeStyle = {
        width: '100%',
        borderTop: '1px solid #000',
    };
    
    return (
        <>
            <div className={`input_box textarea_box ${size ? 'input_box_'+size : ''}`} style={style}>
                {label && <p className={`input_label ${required ? 'required' : ''}`}>{label}</p> }

                <div className="input_section_textarea">
                    <textarea 
                        ref={textAreaRef}
                        name={name} 
                        id={name} 
                        className={className + (readOnly ? " disable" : "") + (withButton ? " withButton" : "") + (withText ? " withText" : "")} 
                        placeholder={placeholder} 
                        onChange={handleChange} 
                        onFocus={handleFocus}
                        onClick={handleClick}
                        onBlur={() => {handleBlur(); onBlur && onBlur()}}
                        maxLength={maxlength ? maxlength : undefined} 
                        readOnly={withButton === '주소찾기' || withButton === '지역선택' ? true : readOnly} 
                        value={value}
                        style={height ? {height: height} : {}}
                        ></textarea>
                </div>

                {error && !f &&
                    <p className="input_error">{error}</p>
                }
                {success && !f &&
                    <p className="input_success">{success}</p>    
                }
                {msg &&
                    <p className="input_msg">{msg}</p>    
                }
                {/* <p className="input_count"><span>{value ? value.length : '0'}</span>/{maxlength ? maxlength : "500"}</p> */}
            </div>
        </>
    )    
}