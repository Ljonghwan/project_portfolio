import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';

import PortpolioTrashListBox from '@/components/Box/PortpolioTrashListBox';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";

import { useDebouncedTimeout } from "@/libs/utils";

import API from "@/libs/api";

import { usePopupComponent } from '@/store';

export default function Page() {

    const { open } = usePopupComponent();

    const [list, setList] = useState([]);

    const [initLoad, setInitLoad] = useState(true);
    const [load, setLoad] = useState(false);

    const setDebouncedTimeout = useDebouncedTimeout();

    useEffect(() => {

        dataFunc();

    }, [open])

    const dataFunc = async (reset=false) => {

        if(reset) {
            setInitLoad(true);
        }
        const { data, error } = await API.post('/admin/portpolio/trash');

        setList(data || [])

        setDebouncedTimeout(() => {
            setLoad(false)
            setInitLoad(false)
        }, consts.apiDelay); 
    }


	return (
		<>
            <PortpolioTrashListBox 
                // style={{ flex: 0.25 }}
                list={list}
                load={initLoad}
                dataFunc={dataFunc}
            />
            
            {/* <UserListBox /> */}
            {/* <UserListBox /> */}
		</>
	)
}