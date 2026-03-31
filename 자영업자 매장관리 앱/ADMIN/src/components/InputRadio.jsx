import React, { useEffect, useState } from 'react';

import consts from "@/libs/consts";
import images from "@/libs/images";

export default function Components(props) {

    const { 
        label,
        className="",
        required,
        value,
        setValue,
        onChange,
        options,
        disabled=false
    } = props;


    const handleChange = (x) => {

        setValue(x?.idx);
        
    }

    return (
        <div style={{ width: '100%' }}>
            {label && ( <p className={`input_label ${required ? 'required' : ''}`}>{label}</p> )}
            <div className='flex' style={{ gap: 20 }}>
                {options?.map((x, i) => {
                    return (
                        <div key={i} className='input_check_box' onClick={() => disabled ? {} : handleChange(x)}>
                            <img src={value === x?.idx ? images.check_on : images.check_off} />
                            <p>{x?.title}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )    
}