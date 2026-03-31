import React, { useEffect, useState, useRef } from 'react';

import _ from "lodash";
import dayjs from "dayjs";
import { GroupedVirtuoso } from 'react-virtuoso';
import { toast } from 'react-toastify';
import Zoom from 'react-medium-image-zoom';

import { useUser, usePopup, useGallery } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";

import API from "@/libs/api";

import { regFileImage, regFileVideo, regFilePdf, regFileExcel, regFileDoc, useDebouncedTimeout } from "@/libs/utils";

export default function Component({ 
    ref,
    type=null,
    name="file",
    valid="image",
    filesValue, 
    setfilesValue,
    imageStyle,
}) {

    const { token, mbData, logout } = useUser();

    const fileInput = ref || useRef(null);

    useEffect(() => {
        console.log('filesValue', filesValue);
    }, [filesValue]);

    const handleChange = async (e) => {

        var files = e.target.files;
        console.log(files);
        if(files.length < 1) return;

        var reg = "";
        var msg = "";
        var cker = true;

        if(valid === 'image') {
            reg = regFileImage;
            msg = "이미지 파일만 등록 가능합니다.";
        } else if(valid === 'video') {
            reg = regFileVideo;
            msg = "영상 파일만 등록 가능합니다.";
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
        <>
            {type === 1 ? (
                !filesValue && (
                    <label className='input_file_simple' htmlFor={name} onDragOver={handleDragOver} onDrop={handleDrop}>
                        <img src={images.add_black} alt={consts.imgAlt} />
                        <p>파일 첨부</p>
                    </label>
                )
            ) : (
                <label className='input_file' htmlFor={name} onDragOver={handleDragOver} onDrop={handleDrop}>
                    {/* <img src={images.add} alt={consts.imgAlt} /> */}
                    {/* <p >이미지 첨부(최대 10장)<span>jpg, jpeg, png 형식만 첨부 가능</span></p> */}
                    <p>{`파일을 선택하거나 드래그 앤 드롭하세요.`}</p>
                    {valid && <p>{`${valid} 파일만 업로드 가능합니다.`}</p>}
                    {/* <p>{`PC에서 선택하기`}</p> */}
                </label>
            )}

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
                                <img src={filesValue?.base || consts.s3Url + (filesValue?.file || filesValue)} alt={consts.imgAlt} style={imageStyle}/>
                            </Zoom>
                        </div>
                    ) : valid === 'video' ? (
                        <div className='files_list_one'>
                            <button className='delete_btn2' onClick={fileDelete}/>
                            <video 
                                src={filesValue?.base || consts.s3Url + (filesValue?.file || filesValue)} style={imageStyle}
                                muted 
                                playsInline 
                                loop 
                                autoPlay
                            >
                            </video>
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

        </>
    )    
}