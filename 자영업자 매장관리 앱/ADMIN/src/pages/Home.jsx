import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';

import BoardListBox from '@/components/Box/BoardListBox';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";

import { useDebouncedTimeout } from "@/libs/utils";

import API from "@/libs/api";

import { usePopupComponent } from '@/store';

export default function Page() {

    const [list, setList] = useState([]);

    const [initLoad, setInitLoad] = useState(true);
    const [load, setLoad] = useState(false);

    const setDebouncedTimeout = useDebouncedTimeout();

    useEffect(() => {

        dataFunc();

    }, [])

    const dataFunc = async (reset = false) => {

        if (reset) {
            setInitLoad(true);
        }

        const { data, error } = await API.post('/admin/dashboard');

        setList(data || [])

        setDebouncedTimeout(() => {
            setLoad(false)
            setInitLoad(false)
        }, consts.apiDelay);
    }


    return (
        <>
            <BoardListBox
                // style={{ flex: 0.25 }}
                list={list}
                load={initLoad}
            />

            {/* <UserListBox /> */}
            {/* <UserListBox /> */}
        </>
    )
}