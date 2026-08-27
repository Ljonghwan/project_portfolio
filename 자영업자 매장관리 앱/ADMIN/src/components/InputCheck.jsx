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
    } = props;


    const handleChange = (x) => {

        if(value?.includes(x)) {
            setValue(prev => prev?.filter(item => item !== x));
        } else {
            setValue(prev => [...prev, x]);
        }
    }

    return (
        <div style={{ width: '100%' }}>
            {label && ( <p className={`input_label ${required ? 'required' : ''}`}>{label}</p> )}
            <div className='flex' style={{ gap: 20 }}>
                {options?.map((x, i) => {
                    return (
                        <div key={i} className='input_check_box' onClick={() => handleChange(x)}>
                            <img src={value?.includes(x) ? images.check_on : images.check_off} />
                            <p>{x}</p>
                        </div>
                    )
                })}
            </div>
            
        </div>
    )    
}