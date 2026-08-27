import React, { useEffect, useState } from 'react';

export default function Input(props) {

    const { 
        className="", 
        placeholder, 
        type="text", 
        name, 
        maxlength, 
        value, 
        setValue,
        options=[], 
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
       
    };
    
    return (
        <div className='select_container'  >
            {label && ( <p className='input_label'>{label}</p> )}
            
            <div className='select_list'>
                {options?.map((x, i) => {
                    return (
                        <p 
                            key={i} 
                            className={`${x === value ? 'active' : ''}`} 
                            data-cursor-size="0px"
                            onClick={() => {
                                setValue(x)
                            }}
                        >{x}</p>
                    )
                })}
            </div>

        </div>
    )    
}