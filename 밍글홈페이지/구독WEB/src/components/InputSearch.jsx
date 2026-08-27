import React, { useEffect, useState } from 'react';

import images from "@/libs/images";

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
        autoComplete="off"
    } = props;


    const [f, setF] = useState(false);

    const handleFocus = () => {
        setF(true);
    };


    const handleChange = (e) => {
        
        if(setError) setError('');

        setValue(e.target.value);
    };


    return (
        <div className={`input_search_box`} style={style}>
            <button className='search_icon' />
            <input 
                type={type} 
                name={name} 
                id={name} 
                className={className + (readOnly ? " disable" : "") + (withButton ? " withButton" : "") + (withText ? " withText" : "") + (search ? ' withSearch' : '')} 
                placeholder={placeholder} 
                onChange={handleChange} 
                onFocus={handleFocus}
                onBlur={() => {onBlur && onBlur()}}
                onKeyDown={(e) => {onKeyDown && onKeyDown(e)}}
                value={value}
                maxLength={maxlength ? maxlength : "255"} 
                readOnly={readOnly} 
                autoComplete={autoComplete}
            />   
            {value && <button className='remove_icon' onClick={() => setValue("")}/>}
        </div>
    )    
}