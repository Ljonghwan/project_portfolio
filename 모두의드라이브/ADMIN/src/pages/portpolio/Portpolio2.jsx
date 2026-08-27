import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";

import { useDebouncedTimeout, useAutoScroll } from "@/libs/utils";

import API from "@/libs/api";

import { usePopupComponent } from '@/store';

import Loading from "@/components/Loading";

const SortableItem = ({ item }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.idx });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        padding: "4px",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        cursor: "grab",
        boxShadow: isDragging
          ? "0 4px 10px rgba(0,0,0,0.15)"
          : "none",
        opacity: isDragging ? 0.9 : 1,
        zIndex: isDragging ? 1000 : "auto",
        position: "relative",
    };

    return (
        <div ref={setNodeRef} className="sort_list" style={style} {...attributes} {...listeners}>
            <img src={images.drag} />
            <p>{item?.title} - {item?.cate?.toString()} [{item?.status === 1 ? '노출' : '미노출'}]</p>
        </div>
    );
};

export default function App() {

    // useAutoScroll();

    const [list, setList] = useState([]);

    const [initLoad, setInitLoad] = useState(true);
    const [load, setLoad] = useState(false);

    const setDebouncedTimeout = useDebouncedTimeout();

    const sensors = useSensors(
        useSensor(PointerSensor)
    );

    useEffect(() => {

        dataFunc();

    }, [])

    const dataFunc = async (reset = false) => {

        if (reset) {
            setInitLoad(true);
        }

        const { data, error } = await API.post('/admin/portpolio');

        setList(data || [])

        setDebouncedTimeout(() => {
            setLoad(false)
            setInitLoad(false)
        }, consts.apiDelay);
    }

    const submitFunc = async () => {

        if(load) return;

        setLoad(true);

        const id = toast.loading("Please wait...");

        const sender = {
            list: list,
        }

        const { data, error } = await API.post('/admin/portpolio/order', sender, { id });

        setDebouncedTimeout(() => {

            setLoad(false);

            if(error) {
                return;
            }
            
            toast.update(id, { render: '정상 처리 되었습니다.', type: "success",  ...consts.toastOption});
            dataFunc();

        }, consts.apiDelay); 

    }

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const oldIndex = list.findIndex((item) => item.idx === active.id);
            const newIndex = list.findIndex((item) => item.idx === over.id);
            setList((prev) => arrayMove(prev, oldIndex, newIndex));
        }
    };

    return (
        <div className='box' >
            {initLoad && <Loading  />}
            <div className='box_container' >
                <div className='title_box'>
                    <p className='title'>노출 순서</p>
                    {/* <p className='sub_title'>업로드 하신 파일을 다운로드 받을 수 있도록 푸터에 노출됩니다.</p> */}
                </div>

                <div className={'list_box'} >
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={list.map((item) => item.idx)} strategy={verticalListSortingStrategy}>
                            {list.map((item) => (
                                <SortableItem key={item.idx} item={item} />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <div className='btn_box' >
                    <button className='btn2' onClick={submitFunc}>순서저장</button>
                </div>
            </div>
        </div>
    );
}