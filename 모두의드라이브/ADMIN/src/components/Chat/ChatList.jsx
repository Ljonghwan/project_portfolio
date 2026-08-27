import React, { useEffect, useState, useRef } from 'react';

import _ from "lodash";
import dayjs from "dayjs";
import { GroupedVirtuoso } from 'react-virtuoso';

import ChatItem from "@/components/Chat/ChatItem";
import Empty from "@/components/Empty";

import { useUser, usePopup, useGallery } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";

import { getProfile, numFormat, useDebouncedTimeout, clickImg, hpHypen } from "@/libs/utils";

import styles from './index.module.css';

export default function Chat({ listRef, chat, room, mode }) {

    const { token, mbData, logout } = useUser();

    const [chatGroupCount, setchatGroupCount] = useState([0]);
    const [chatGroup, setchatGroup] = useState([]);

    const [isBottom, setisBottom] = useState(false);

    useEffect(() => {

        console.log('chat', chat);

        if(chat.length > 0) {

            const groupedUsers = _.groupBy(chat, (item) => dayjs(item.createAt).format('YYYY-MM-DD'));
            const groupCounts = Object.values(groupedUsers).map((item) => item.length)
            const groups = Object.keys(groupedUsers)

            setchatGroupCount(groupCounts);
            setchatGroup(groups);

            if(isBottom || chat[chat.length-1]?.sender?.idx === mbData?.idx ) {
                listRef?.current?.scrollToIndex(chat.length);
            }

        } else {
            setchatGroupCount([0]);
            setchatGroup([]);
        }
       
    }, [chat]);

    if(chat?.length < 1) return (
        <Empty msg={`대화 내용이 없습니다.\n메시지를 전송하세요.`} icon={images.message}/>
    )
    
    return (
        <>
            <GroupedVirtuoso
                ref={listRef}
                className={styles.chat_list}
                groupCounts={chatGroupCount}
                initialTopMostItemIndex={chatGroupCount.length - 1}
                overscan={1000}
                groupContent={index => {
                    return (
                        <div className={styles.chat_group_title} style={{ position: 'relative' }}>
                            <p>{dayjs(chatGroup[index]).format('YYYY.MM.DD (ddd)')}</p>
                        </div>
                    )
                }}
                itemContent={index => {
                    let prev = chat?.[index - 1];

                    return (
                        <ChatItem 
                            item={chat[index]} 
                            me={
                                mode === 'viewerAdmin' ? chat?.[index]?.senderType === 'manager' 
                                : mode === 'viewer' ? chat?.[index]?.sender?.level === 2 
                                : chat?.[index]?.sender?.idx === mbData?.idx
                            } 
                            index={index}
                            attach={(prev?.type === 'text' && prev?.sender?.idx === chat?.[index]?.sender?.idx)}


                            user={room?.user}
                            vipUser={room?.topUser}
                        />
                    )
                }}
                atBottomThreshold={100}
                atBottomStateChange={(bool) => {
                    setisBottom(bool);
                }}
            />
            {/* {!isBottom && <button className={styles.down_button}>아래로</button>} */}
        </>
    )    
}