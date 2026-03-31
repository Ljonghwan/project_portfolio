import React, { useEffect, useState, useRef } from 'react';

import _ from "lodash";
import dayjs from "dayjs";
import { GroupedVirtuoso } from 'react-virtuoso';
import { toast } from 'react-toastify';
import Zoom from 'react-medium-image-zoom';

import { useUser, usePopup } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";

import API from "@/libs/api";

import { regFileImage, regFilePdf, regFileExcel, regFileDoc, useDebouncedTimeout } from "@/libs/utils";

export default function Component({ 
    name="file",
    valid,
    filesValue, 
    setfilesValue
}) {

    const { token, mbData, logout } = useUser();

    const fileInput = useRef(null);

    useEffect(() => {
        console.log('filesValue', filesValue);
    }, [filesValue]);

    const handleChange = async (e) => {

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

        var files = e.target.files;
        if(files.length < 1) return;

        var reg = "";
        var msg = "";
        var cker = true;

        if(valid === 'image') {
            reg = regFileImage;
            msg = "이미지 파일만 등록 가능합니다.";
        } else if(valid === 'pdf') {
            reg = regFilePdf;
            msg = "PDF 파일만 등록 가능합니다.";
        } else if(valid === 'excel') {
            reg = regFileExcel;
            msg = "엑셀 파일만 등록 가능합니다.";
        } else {
            reg = regFileDoc;
            msg = "문서 파일만 등록 가능합니다.";
        }
       
        for (var i = 0; i < files.length; i++) {
            var file = files[i]
            if(!file.name.toLowerCase().match( reg )) {
                cker = false;
            } else if (file.size > MAX_FILE_SIZE) {
                toast.error("10MB 이하만 첨부가능합니다.", consts.toastErrorOption);
                fileInput.current.value = "";
                return false;
            }
        }
        
        if(!cker) {
            toast.error(msg, consts.toastErrorOption);
            fileInput.current.value = "";
            return false;
        }
        
        let reader = new FileReader();

        let files_url = Array.from(files).map(file => {
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
        setfilesValue(res?.[0] || null);
        fileInput.current.value = "";
        
    };

    const fileDelete = () => {

        setfilesValue(null);
      
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
        <div className='file_container'>

             <div className='label_box'>
                <label className='input_file' htmlFor={name} onDragOver={handleDragOver} onDrop={handleDrop}>
                    <p>파일첨부</p>
                    <img src={images.add_black} alt={consts.imgAlt} />
                    {/* <p>첨부파일(PDF,ZIP,JPG,PPT,XLS,DOC,HWP / 최대 10MB / 2개)</p> */}
                </label>
                <p>10MB 이상의 파일은 info@minglecorp.co.kr로 보내주세요.</p>
            </div>

            <input 
                style={{ display: 'none' }}
                ref={fileInput}
                type={'file'}
                id={name} 
                onChange={handleChange}
            />    

            {filesValue && (
                <div className='files_list'>
                    {valid === 'image' ? (
                        <div className='files_list_one'>
                            <button className='delete_btn2' onClick={fileDelete}/>
                            <Zoom>
                                <img src={filesValue?.base || consts.s3Url + filesValue?.file} alt={consts.imgAlt} />
                            </Zoom>
                        </div>
                    ) : (
                        <div className='files_list_one_doc'>

                            {filesValue?.file ? (
                                <p className={'link'} onClick={async () => {
                                    await API.download({ name: filesValue?.name, file: filesValue?.file })
                                }}>{filesValue?.name}</p>
                            ) : (
                                <p>{filesValue?.name}</p>
                            )}
                            
                            <button className='delete_btn2' onClick={fileDelete}/>
                        </div>
                    )}
                    
                </div>
            )}

        </div>
    )    
}