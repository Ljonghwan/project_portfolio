import React, { useEffect, useState, useRef } from 'react';
import ReactPaginate from 'react-paginate';

import styles from './table.module.css';
import InputSelect from '../InputSelect';
import Pagination from '../Pagenation';
import Images from '@/libs/images';

export default function DataTable(props) {
    const {
        header,
        body = (item, index) => { },
        datas = [],
    } = props;

    const [viewCount, setViewCount] = useState(10)
    const [viewList, setViewList] = useState([]);
    const [page, setPage] = useState(1)

    function getPaginate(list, page, viewCount) {
        const startIndex = (page - 1) * viewCount;
        console.log("🚀 ~ getPaginate ~ startIndex:", startIndex, startIndex * 1 + viewCount * 1, list.length)
        return list.slice(startIndex, startIndex * 1 + viewCount * 1);
    }

    useEffect(() => {
        console.log("viewCount", viewCount * 1)
        setViewList(getPaginate(datas, page, viewCount));
    }, [page, viewCount])

    useEffect(() => {
        console.log("🚀 ~ DataTable ~ datas:", datas.length)
        setPage(1);
        setViewList(getPaginate(datas, 1, viewCount));
    }, [datas])

    return <div style={{ position: "relative", height: "100%" }}>
        <div className={styles.table}>
            <table style={{ width: "100%" }}>
                <thead>
                    <tr >
                        {header && header()}
                    </tr>
                </thead>

                <tbody>
                    {body && viewList.map(body)}
                </tbody>
            </table>
        </div>


        <div className={styles.page_box}>
            <div style={{ width: 80 }}>
                <InputSelect
                    name="cate"
                    value={viewCount}
                    setValue={(val) => {
                        setPage(1)
                        setViewCount(val)
                    }}
                    optionNotKey={[10, 20, 50, 100]}
                />
            </div>


            <ReactPaginate
                containerClassName={styles.pg}
                pageClassName={styles.pg__item}
                pageLinkClassName={styles.pg__link}
                activeClassName={styles.pg__item__active}
                activeLinkClassName={styles.pg__link__active}
                breakClassName={styles.pg__item}
                breakLinkClassName={styles.pg__link}

                // previousClassName={styles.pg__nav}
                previousClassName={styles.pg__nav_prev}
                previousLinkClassName={styles.pg__navLink}

                // nextClassName={styles.pg__nav}
                nextClassName={styles.pg__nav_next}
                nextLinkClassName={styles.pg__navLink}

                disabledClassName={styles.is_disabled}

                // previousLabel="‹"
                previousLabel={<img src={Images.arrow_left} />}
                nextLabel={<img style={{ transform: "rotate(180deg)" }} src={Images.arrow_left} />}
                breakLabel="..."

                pageRangeDisplayed={1}     // 가운데(현재 주변) 페이지는 아예 안 보여줌
                marginPagesDisplayed={2}   // 양끝 2개씩만 고정 노출
                forcePage={page - 1}
                pageCount={Math.ceil(datas.length / viewCount)}
                onPageChange={(e) => setPage(e.selected + 1)}
                renderOnZeroPageCount={null}
            />
            {/* 
            <Pagination
                totalPage={Math.ceil(datas.length / viewCount)}
                limit={8}
                page={page}
                setPage={setPage}
            /> */}

            <div style={{ width: 80 }}></div>
        </div>
    </div>
}