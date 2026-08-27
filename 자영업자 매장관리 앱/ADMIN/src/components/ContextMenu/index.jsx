import React, { useEffect, useState, useRef } from 'react';

import { Menu, Item, Separator, Submenu, useContextMenu } from 'react-contexify';
import 'react-contexify/ReactContexify.css';

import images from "@/libs/images";

import styles from './index.module.css';

export default function Component({
    children,

    id = "context",
    idx,
    style,

    list=[],
    listValue=null,
    handleEvent=()=>{},
}) {

    const { show } = useContextMenu({
        id: id,
    });

    const handleContextMenu = (event) => {
        console.log('event', event);
        show({
            event,
            props: {
                key: 'value'
            }
        })
    }

    // I'm using a single event handler for all items
    // but you don't have too :)
    const handleItemClick = ({ data, event, props }) => {
        handleEvent({ key: data?.key, idx: idx, target: data?.target });
    }

    return (
        <div style={style} onClick={handleContextMenu}>
            {children}
            <Menu id={id} >
                <Item data={{ key: "file" }} onClick={handleItemClick}>아이콘 변경</Item>
                <Item data={{ key: "delete" }} onClick={handleItemClick}>아이콘 삭제</Item>
                <Separator />
                <Submenu label="포트폴리오 연결" style={{ maxHeight: 400, overflow: 'auto' }}>
                    <Item data={{ key: "portpolio", target: null }} onClick={handleItemClick}>
                        <div className={styles.flex} >
                            <p>미지정</p>
                            {!listValue && ( <p>✓</p> )}
                        </div>
                    </Item>
                    {list?.map((x, i) => {
                        return (
                            <Item key={i} data={{ key: "portpolio", target: x?.idx }} onClick={handleItemClick}>
                                <div className={styles.flex} >
                                    <p>{x?.title}</p>
                                    {x?.idx === listValue && ( <p>✓</p> )}
                                </div>
                            </Item>
                        )
                    })}
                </Submenu>
            </Menu>
        </div>
       
    )
}