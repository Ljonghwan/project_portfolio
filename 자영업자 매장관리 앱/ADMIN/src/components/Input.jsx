import React, { useEffect, useState } from 'react';

import DaumPostcode from 'react-daum-postcode';

export default function Input(props) {

    const {
        className,
        placeholder,
        type,
        name,
        maxlength,
        value,
        setValue,
        onChange,
        valid,
        label,
        required,
        error,
        setError,
        success,
        readOnly,
        onBlur,
        onKeyDown,
        withButton,
        withButtonPress,
        withText,
        size,
        index,
        subIndex = null,
        full,
        help,
        search,
        style,
        inputStyle,
        autoComplete = "off"
    } = props;


    const [f, setF] = useState(false);

    const [isOpenPost, setIsOpenPost] = useState(false);

    const handleFocus = () => {
        setF(true);

        if (withButton === "주소찾기") {
            setIsOpenPost(true);
        }

    };

    const handleBlur = () => {
        setF(false);
    }


    const handleChange = (e) => {

        if (setError) setError('');

        if (valid === 'num') {
            const num = e.target.value.replace(/\D/g, "") * 1;
            console.log('valid', num + '/' + valid);

            if (onChange) {
                onChange((prev) => {
                    return (
                        { ...prev, [e.target.name]: num }
                    )
                });
            } else {
                setValue(num);
            }

        } else if (valid === 'float') {
            const num = e.target.value.replace(/[^0-9.]/g, "");
            console.log('valid', num + '/' + valid);

            if (onChange) {
                onChange((prev) => {
                    return (
                        { ...prev, [e.target.name]: num }
                    )
                });
            } else {
                setValue(num);
            }

        } else {

            if (onChange) {
                onChange((prev) => {
                    return (
                        { ...prev, [e.target.name]: e.target.value }
                    )
                });
            } else {
                setValue(e.target.value);
            }

        }
    };

    const withButtonFunc = () => {
        if (withButton === '복사') {
            navigator.clipboard.writeText(value);
        } else if (withButton === "주소찾기") {
            setIsOpenPost(true);
        }
    }

    const onCompletePost = (data) => {
        let fullAddr = data?.address;
        setValue(fullAddr);

        setIsOpenPost(false);
    };

    const postCodeStyle = {
        width: '100%',
        height: 350,
        borderTop: '1px solid #DDD',
    };


    return (
        <div style={{ width: '100%' }}>
            {label && (<p className={`input_label ${required ? 'required' : ''}`}>{label}</p>)}
            <div className='input_text_box'>
                <div className={`input_search_box`} style={style}>
                    <input
                        type={type}
                        name={name}
                        id={name}
                        style={{ padding: '0 40px 0 12px', ...inputStyle }}
                        className={className + (readOnly ? " disable" : "") + (withButton ? " withButton" : "") + (withText ? " withText" : "") + (search ? ' withSearch' : '')}
                        placeholder={placeholder}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={() => { handleBlur(); onBlur && onBlur() }}
                        onKeyDown={(e) => { onKeyDown && onKeyDown(e) }}
                        value={value}
                        maxLength={maxlength ? maxlength : "255"}
                        readOnly={readOnly}
                        autoComplete={autoComplete}
                    />
                    {(value && !readOnly) ? <button tabIndex="-1" className='remove_icon' onClick={() => handleChange({ target: { name: name, value: "" } })} /> : <></>}
                </div>
                {withButton &&
                    <button tabIndex="-1" type="button" className="input_with_button" onClick={() => { withButtonFunc(); withButtonPress && withButtonPress() }}>{withButton}</button>
                }
                {withText && 
                    <p>{withText}</p>
                }
            </div>
            {isOpenPost ? (
                <div className='post_box' >
                    <button type="button" className="exit_btn" onClick={() => setIsOpenPost(false)} />
                    <DaumPostcode style={postCodeStyle} autoClose onComplete={onCompletePost} />
                </div>
            ) : null}
        </div>
    )
}