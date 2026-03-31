import React, { useEffect, useState } from 'react';

import DaumPostcode from 'react-daum-postcode';

export default function Input(props) {

    const { 
        className="", 
        placeholder, 
        type="text", 
        name, 
        maxlength, 
        value, 
        setValue, 
        onChange,
        valid, 
        label, 
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
        subIndex=null,
        full,
        help,
        search,
        style,
        autoComplete="off",
        tabIndex
    } = props;


    const [f, setF] = useState(false);

    const [isOpenPost, setIsOpenPost] = useState(false);

    const handleFocus = () => {
        setF(true);

        if(withButton === "주소찾기") {
            setIsOpenPost(true);
        }

    };

    const handleBlur = () => {
        setF(false);
    }


    const handleChange = (e) => {
        
        if(setError) setError('');

        if(valid === 'num') {
            const num = e.target.value.replace(/\D/g, "")*1;
            console.log('valid', num + '/' + valid);

            if(onChange) {
                onChange(index, e, num, subIndex);
            } else {
                setValue(num);
            }

        } if(valid === 'hp') {
            const num = e.target.value.replace(/\D/g, "");
            console.log('valid', num + '/' + valid);

            if(onChange) {
                onChange(index, e, num, subIndex);
            } else {
                setValue(num);
            }

        } else if(valid === 'float') {
            const num = e.target.value.replace(/[^0-9.]/g, "");
            console.log('valid', num + '/' + valid);

            if(onChange) {
                onChange(index, e, num, subIndex);
            } else {
                setValue(num);
            }

        } else {

            if(onChange) {
                onChange(index, e, e.target.value, subIndex);
            } else {
                setValue(e.target.value);
            }
            
        }
    };
    
    return (
        <div className={'input_container'} data-cursor-size="0px" >
            {label && ( <p className='input_label'>{label}</p> )}
            <input 
                type={type} 
                name={name} 
                id={name} 
                className={className + (readOnly ? " disable" : "") + (withButton ? " withButton" : "") + (withText ? " withText" : "") + (search ? ' withSearch' : '')} 
                placeholder={placeholder} 
                onChange={handleChange} 
                onFocus={handleFocus}
                onBlur={() => { handleBlur(); onBlur && onBlur()}}
                onKeyDown={(e) => {onKeyDown && onKeyDown(e)}}
                value={value}
                maxLength={maxlength ? maxlength : 1000} 
                readOnly={readOnly} 
                autoComplete={autoComplete}
            />   

        </div>
    )    
}