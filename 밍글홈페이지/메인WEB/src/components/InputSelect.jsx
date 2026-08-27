import React, { useEffect, useState } from 'react';
import dayjs from "dayjs";

export default function InputSelect(props) {

    const { 
        className, 
        placeholder, 
        type, 
        name, 
        name2, 
        maxlength, 
        value, 
        setValue, 
        valid, 
        label, 
        error, 
        errorFix,
        errorFix2,
        success, 
        readOnly, 
        onBlur,
        onChange,
        onChangeMulti,
        onChangeAfter,
        afterTarget="",
        onChangeFunc,
        index,
        onSearch,
        withButton, 
        withButtonPress,
        option=[],
        optionLabel,
        city,
        optionYear,
        optionMonth,
        optionHour,
        optionMin,
        optionHp,
        optionNotKey,
        setMynum,
        notKey,
        style,
        labelStyle,
        full
    } = props;

    const handleChange = (e) => {
        if(onChangeMulti) {
            let nm2 = {target: {name: name2 ? name2 : ""}};
            onChangeMulti(index, e, nm2, e.target.value, "")
        } else if(onChange) {
            onChange(index, e, e.target.value);
            onChangeAfter && onChangeAfter(index, afterTarget);
        } else if(onSearch) {
            onSearch(name, e.target.value);
        } else {
            setValue(e.target.value);
            onChangeFunc && onChangeFunc(e.target.value);
        }
    };
   
    return (
        <div className={full ? "input_box input_box_select input_box_full" : "input_box input_box_select"} style={style} data-cursor-size="0">
            {label && <label className="input_label" style={labelStyle} htmlFor={name}>{label}</label>}
            {optionLabel && 
                <span className="input_option_label">{optionLabel}</span>
            }
            <div className="input_section">
                <select name={name} onChange={handleChange} key={value} defaultValue={value} className={readOnly && "disable"} disabled={readOnly}>
                    {placeholder && <option value="">{placeholder}</option>}
                    {option?.length > 0 && option?.map((x, i) => {
                        return (
                            <option key={i} value={city ? x.area_id : x.idx} selected={value === (city ? x.area_id : x.idx)} >{city ? x.area_name : x.title}</option>
                        )
                    })}
                    {optionYear && [...Array((dayjs().format('YYYY')*1) - 2019)].map((d, i) => {
                        let val = 2020+i;
                        return (
                            <option key={i} value={val} selected={value === val} >{val + "년"}</option>
                        )
                    })}

                    {optionMonth && [...Array(12)].map((d, i) => {
                        let val = (i+1 < 10) ? "0" + (i+1) : i+1;
                        return (
                            <option key={i} value={val} selected={value === val} >{val + "월"}</option>
                        )
                    })}

                    {optionHour && [...Array(24)].map((d, i) => {
                        let val = (i+1 < 10) ? "0" + (i+1) : i+1;
                        return (
                            <option key={i} value={val} selected={value === val} >{val + "시"}</option>
                        )
                    })}
                    {optionMin && [...Array(60)].map((d, i) => {
                        let val = (i+1 < 10) ? "0" + (i+1) : i+1;
                        return (
                            <option key={i} value={val} selected={value === val} >{val + "분"}</option>
                        )
                    })}
                    {optionHp && 
                        <>
                            <option value={"010"} selected={value === "010"} >{"010"}</option>
                            <option value={"011"} selected={value === "011"} >{"011"}</option>
                            <option value={"016"} selected={value === "016"} >{"016"}</option>
                            <option value={"017"} selected={value === "017"} >{"017"}</option>
                        </>
                    }
                    {optionNotKey && optionNotKey.map((x, i) => {
                        return (
                            <option key={i} value={x} selected={value === x} >{x}</option>
                        )
                    })}
                </select>
            </div>

            {error &&
                <p className="input_error">{error}</p>
            }
            {success && 
                <p className="input_success">{success}</p>    
            }
         
        </div>
    )    
}