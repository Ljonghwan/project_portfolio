import React, { useEffect, useState, useRef } from 'react';

import _ from "lodash";
import dayjs from "dayjs";
import { GroupedVirtuoso } from 'react-virtuoso';
import { toast } from 'react-toastify';

import { useUser, usePopup, useGallery } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";

import styles from './index.module.css';

import { regFileImage, useDebouncedTimeout } from "@/libs/utils";

export default function Chat({ submit, item, socketRef }) {

    const { token, mbData, logout } = useUser();

    const fileInput = useRef(null);
    const textAreaRef = useRef(null);

    const setDebouncedTimeout = useDebouncedTimeout();

    const [chatMsg, setchatMsg] = useState("");
    const [filesValue, setfilesValues] = useState([]);

    const [ing, setIng] = useState(false);

    useEffect(() => {

        setchatMsg("");
        setfilesValues([]);

    }, [item]);

    useEffect(() => {
        if (socketRef?.current) { // 소켓이 연결되었을때
            if (chatMsg) {
                socketRef?.current?.emit('input', true);
            } else {
                socketRef?.current?.emit('input', false);
            }
        }
    }, [socketRef, chatMsg])

    useEffect(() => {
        if (textAreaRef) {
            textAreaRef.current.style.height = "0px";
            const scrollHeight = textAreaRef.current?.scrollHeight;

            textAreaRef.current.style.height = (scrollHeight < 1 ? textAreaRef.current.style.minHeight : scrollHeight) + "px";
            textAreaRef.current.scrollTop = scrollHeight;
        }
    }, [textAreaRef, chatMsg]);

    const submitFunc = () => {

       
        if(filesValue?.length > 0) {
            submit(filesValue);
            return;
        }


    }
    
    const inputEventFunc = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitFunc();
            // e.target.dispatchEvent(new KeyboardEvent('keyup', { key:'ArrowRight' }))
            // setTimeout(() => {
            //     submitFunc();
            // }, 300)
        }
    }

    const handleChange = async (e) => {

        var files = e.target.files;
        //console.log(files);
        if(files.length < 1) return;
        if((files.length + filesValue?.length) > 10) {

            toast.error("최대 10개까지 등록 가능합니다.", consts.toastErrorOption);
            return;
        }

        var reg = "";
        var msg = "";
        var file_arr = [];
        var file_url_arr = [];
        var cker = true;
       
        for (var i = 0; i < files.length; i++) {
            var file = files[i]
            if(!file.name.toLowerCase().match(regFileImage)) {
                cker = false;
            }
        }
        
        if(!cker) {
            toast.error("이미지 파일만 등록 가능합니다.", consts.toastErrorOption);
            fileInput.current.value = "";
            return false;
        }
        

        let files_url = Array.from(files).map(file => {
    
            let reader = new FileReader();
            
            // Create a new promise
            return new Promise(resolve => {
                
                let fn = file.name.split('.');

                // Resolve the promise after reading file
                reader.onload = () => {
                    resolve({
                        ext: fn[fn.length-1],
                        base: reader.result,
                        name: file.name
                    });
                }
                
                // Reade the file as a text
                reader.readAsDataURL(file);
                
            });
            
        });

        let res = await Promise.all(files_url);

        setfilesValues([ ...filesValue, ...res ]);
        fileInput.current.value = "";
        
    };

    const fileDelete = (i) => {

        setfilesValues(filesValue?.filter((item, index) => index !== i));
      
    };

    return (
        <>
            {filesValue?.length > 0 && (
                <div className={styles.files_box}>
                    <p className={styles.files_title}>이미지 첨부(최대 10장)<span>jpg, jpeg, png 형식만 첨부 가능</span></p>
                    <div className={styles.files_list}>
                        {filesValue?.map((x, i) => {
                            return (
                                <div key={i}>
                                    <button className='delete_btn' onClick={() => fileDelete(i)}/>
                                    <img src={x?.base} alt={consts.imgAlt} />
                                </div>
                            )
                        })}
                        
                    </div>
                </div>
            )}
            
            <div className={styles.chat_input_box}>
                <div className={styles.chat_input_box_container}>
                    <div className={styles.chat_input_box_button}>
                        <label className={`files_label`} htmlFor="chat_file"/>
                        <button className={`send`} onClick={submitFunc}/>
                        {/* <button className={`send`} onClick={submitFuncTest}/> */}
                        
                    </div>

                    <input 
                        style={{ display: 'none' }}
                        ref={fileInput}
                        type={'file'}
                        id={'chat_file'} 
                        onChange={handleChange}
                        multiple
                    />    
                    
                    <textarea 
                        ref={textAreaRef}
                        className={styles.chat_textarea} 
                        placeholder={'메시지 입력'} 
                        onChange={(e) => setchatMsg(e.target.value)} 
                        onKeyDown={inputEventFunc}
                        value={chatMsg}
                        spellCheck={false}
                    />

                </div>
            </div>
        </>
    )    
}