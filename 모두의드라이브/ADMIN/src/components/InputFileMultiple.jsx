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

import { regFileImage, useDebouncedTimeout } from "@/libs/utils";

export default function Component({ 
    filesValue, setfilesValues 
}) {

    const { token, mbData, logout } = useUser();

    const fileInput = useRef(null);

    useEffect(() => {

    }, []);

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
                        base: reader.result
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

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.current.files = e.dataTransfer.files;
        handleChange({ target: { files: e.dataTransfer.files }});
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <>
            <label className='input_file' htmlFor="file" onDragOver={handleDragOver} onDrop={handleDrop}>
                <img src={images.image} alt={consts.imgAlt} />
                {/* <p >이미지 첨부(최대 10장)<span>jpg, jpeg, png 형식만 첨부 가능</span></p> */}
                <p>파일을 선택하거나 드래그 앤 드롭하세요. PDF 파일만 업로드 가능합니다.</p>
            </label>

            <input 
                style={{ display: 'none' }}
                ref={fileInput}
                type={'file'}
                id={'file'} 
                onChange={handleChange}
                multiple
            />    

            {filesValue?.length > 0 && (
                <div >
                    {filesValue?.map((x, i) => {
                        return (
                            <div key={i}>
                                <button className='delete_btn' onClick={() => fileDelete(i)}/>
                                <img src={x?.base} alt={consts.imgAlt} />
                            </div>
                        )
                    })}
                </div>
            )}

        </>
    )    
}