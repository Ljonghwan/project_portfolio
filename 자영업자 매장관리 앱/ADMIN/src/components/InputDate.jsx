import React, { useEffect, useState, forwardRef } from 'react';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";

import dayjs from "dayjs";

import images from '@/libs/images';
import consts from '@/libs/consts';

export default function InputDate(props) {

    const { 
        className, 
        placeholder, 
        placeholderEnd,
        type, 
        name, 
        maxlength, 
        dateValue, 
        setDateValue, 
        dateValueEnd, 
        setDateValueEnd, 
        valid, 
        label, 
        error, 
        success, 
        readOnly, 
        multiple,
        index,
        subIndex=null,
        onChange,
        showTime=false, // 시간 선택 옵션 추가
        ...etc
    } = props;

    const [startDate, setStartDate] = useState(dateValue ? new Date(dateValue) : "");
    const [endDate, setEndDate] = useState(dateValueEnd ? new Date(dateValueEnd) : "");

    const [openState1, setOpenState1] = useState(false);
    const [openState2, setOpenState2] = useState(false);

    useEffect(() => {
        setStartDate(dateValue ? new Date(dateValue) : "")
    }, [dateValue])

    useEffect(() => {
        setEndDate(dateValueEnd ? new Date(dateValueEnd) : "")
    }, [dateValueEnd])

    const CustomInput = forwardRef(({ value, onClick }, ref) => (
        <label className={readOnly ? "input_date_label disable" : openState1 ? "input_date_label focus" : "input_date_label"} onClick={!readOnly ? onClick : console.log("")} ref={ref}>
            <span>{dateValue ? dateValue : placeholder}</span>
            {dateValue && (
                <img src={images.remove} onClick={(e) => {
                    e.stopPropagation();
                    setDateValue(null);
                }}/>
            )}
        </label>
    ));

    const CustomInputEnd = forwardRef(({ value, onClick }, ref) => (
        <label className={readOnly ? "input_date_label disable" : openState2 ? "input_date_label focus" : "input_date_label"} onClick={!readOnly ? onClick : console.log("")} ref={ref}>
            <span>{dateValueEnd ? dateValueEnd : placeholderEnd}</span>
            {dateValueEnd && (
                <img src={images.remove} onClick={(e) => {
                    e.stopPropagation();
                    setDateValueEnd(null);
                }}/>
            )}
        </label>
    ));

    const setValueFunc = (date) => {
        // showTime에 따라 포맷 변경
        let val = showTime 
            ? dayjs(date).format('YYYY-MM-DD HH:mm')
            : dayjs(date).format('YYYY-MM-DD');

        if(onChange) {
            let nm = {target: {name: name}};
            onChange(index, nm, val, subIndex);
        } else {
            setDateValue(val);
        }
    }

    const setValueEndFunc = (date) => {
        let val = showTime 
            ? dayjs(date).format('YYYY-MM-DD HH:mm')
            : dayjs(date).format('YYYY-MM-DD');
        
        setDateValueEnd(val);
    }
   
    return (
        <div className="input_box">
            {label && <label className="input_label" htmlFor={name}>{label}</label>}

            <div className="input_section">
                {!multiple ? (
                    <DatePicker 
                        selected={startDate} 
                        locale={ko}
                        dateFormat={showTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd"}
                        onChange={(date) => setValueFunc(date)} 
                        customInput={<CustomInput />}
                        onCalendarClose={() => setOpenState1(false)}
                        onCalendarOpen={() => setOpenState1(true)}
                        showMonthDropdown
                        showTimeSelect={showTime}
                        timeFormat="HH:mm"
                        timeIntervals={10}
                        timeCaption="시간"
                    />
                ) : (
                    <div className="input_date_section_multi">
                        <div>
                            <DatePicker 
                                selected={startDate} 
                                locale={ko}
                                dateFormat={showTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd"}
                                onChange={(date) => setValueFunc(date)} 
                                customInput={<CustomInput />}
                                onCalendarClose={() => setOpenState1(false)}
                                onCalendarOpen={() => setOpenState1(true)}
                                showTimeSelect={showTime}
                                timeFormat="HH:mm"
                                timeIntervals={10}
                                timeCaption="시간"
                            />
                        </div>
                        <span>~</span>
                        <div>
                            <DatePicker 
                                selected={endDate} 
                                locale={ko}
                                dateFormat={showTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd"}
                                onChange={(date) => setValueEndFunc(date)} 
                                customInput={<CustomInputEnd />}
                                onCalendarClose={() => setOpenState2(false)}
                                onCalendarOpen={() => setOpenState2(true)}
                                showTimeSelect={showTime}
                                timeFormat="HH:mm"
                                timeIntervals={10}
                                timeCaption="시간"
                            />
                        </div>
                    </div>
                )}
                
             
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