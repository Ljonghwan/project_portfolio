import React, { useEffect, useState, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import _ from "lodash";
import dayjs from "dayjs";
import { toast } from 'react-toastify';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";

import { regFileImage, regFilePdf, regFileExcel, regFileDoc, useDebouncedTimeout } from "@/libs/utils";

export default function Component({
    name = "file",
    valid,
    filesValue,
    setfilesValue,
    maxlength = 3
}) {

    const fileInput = useRef(null);

    useEffect(() => {

    }, []);

    const handleChange = async (e) => {

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

        var files = e.target.files;
        //console.log(files);
        if (files.length < 1) return;
        if ((files.length + filesValue?.length) > maxlength) {
            toast.error(`최대 ${maxlength}개까지 등록 가능합니다.`, consts.toastErrorOption);
            return;
        }

        var reg = "";
        var msg = "";
        var cker = true;
        var ckerSize = true;

        if (valid === 'image') {
            reg = regFileImage;
            msg = "이미지 파일만 등록 가능합니다.";
        } else if (valid === 'pdf') {
            reg = regFilePdf;
            msg = "PDF 파일만 등록 가능합니다.";
        } else if (valid === 'excel') {
            reg = regFileExcel;
            msg = "엑셀 파일만 등록 가능합니다.";
        } else {
            reg = regFileDoc;
            msg = "문서 파일만 등록 가능합니다.";
        }


        for (var i = 0; i < files.length; i++) {
            var file = files[i]
            if (!file.name.toLowerCase().match(reg)) {
                cker = false;
            }
            if (file.size > MAX_FILE_SIZE) {
                toast.error("10MB 이하만 첨부가능합니다.", consts.toastErrorOption);
                fileInput.current.value = "";
                return false;
            }
        }

        if (!cker) {
            toast.error(msg, consts.toastErrorOption);
            fileInput.current.value = "";
            return false;
        }


        let files_url = Array.from(files).map(file => {
            // Create a new promise
            let reader = new FileReader();

            return new Promise(resolve => {

                let fn = file.name.split('.');

                // Resolve the promise after reading file
                reader.onload = () => {
                    resolve({
                        ext: fn[fn.length - 1],
                        base: reader.result,
                        name: file.name
                    });
                }

                // Reade the file as a text
                reader.readAsDataURL(file);

            });

        });

        let res = await Promise.all(files_url);

        setfilesValue([...filesValue, ...res]);
        fileInput.current.value = "";

    };

    const fileDelete = (i) => {

        setfilesValue(filesValue?.filter((item, index) => index !== i));

    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.current.files = e.dataTransfer.files;
        handleChange({ target: { files: e.dataTransfer.files } });
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
                <p>3개 첨부 가능 (10MB 이상의 파일은 info@minglecorp.co.kr로 보내주세요.)</p>
            </div>

            <input
                style={{ display: 'none' }}
                ref={fileInput}
                type={'file'}
                id={name}
                onChange={handleChange}
                multiple
                max={maxlength}
                accept={'.ppt, .pptx, .doc, .docx, .pdf, .zip, .xls, .xlsx, .hwp, application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword, application/vnd.ms-excel, application/vnd.ms-powerpoint,application/pdf, image/*'}
            />

            {filesValue?.length > 0 && (
                <div className='files_list'>
                    <AnimatePresence>
                        {filesValue?.map((x, i) => (
                            <motion.div
                                key={i}
                                className='files_list_one_doc'
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                layout // Enables smooth layout transitions
                            >
                                <p>{x?.name}</p>
                                <button className='delete_btn2' onClick={() => fileDelete(i)} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

        </div>
    )
}