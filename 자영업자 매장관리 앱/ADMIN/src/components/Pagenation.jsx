import { useEffect, useState } from "react";
const sliceArrayByLimit = (totalPage, limit) => {
    const totalPageArray = Array(totalPage)
        .fill()
        .map((_, i) => i);
    return Array(Math.ceil(totalPage / limit))
        .fill()
        .map(() => totalPageArray.splice(0, limit));
};

const Pagination = ({
    totalPage,
    limit,
    page,
    setPage,
}) => {
    // 총 페이지 갯수에 따라 Pagination 갯수 정하기, limit 단위로 페이지 리스트 넘기기
    const [currentPageArray, setCurrentPageArray] = useState([]);
    const [totalPageArray, setTotalPageArray] = useState([]);
    const [groupCount, setGroupCount] = useState(0);


    const makeGroup = (index) => {
        const slicedPageArray = sliceArrayByLimit(totalPage, limit);
        if (index < 0) {
            index = 0
        } else if (index > slicedPageArray.length - 1) {
            index = slicedPageArray.length - 1;
        }
        setTotalPageArray(slicedPageArray);
        setCurrentPageArray(slicedPageArray[index]);
        setGroupCount(index)
    }
    useEffect(() => {
        if (page % limit === 1) {
            setCurrentPageArray(totalPageArray[Math.floor(page / limit)]);
        } else if (page % limit === 0) {
            setCurrentPageArray(totalPageArray[Math.floor(page / limit) - 1]);
        }
    }, [page]);

    useEffect(() => {
        makeGroup(groupCount)
    }, [totalPage]);

    return (
        <div className="pagination">
            <button
                className={`page-item ${groupCount == 0 && "off"}`}
                onClick={() => {
                    makeGroup(groupCount - 1);
                }}
                disabled={groupCount == 0}
            >
                {"<"}
            </button>
            {currentPageArray?.map((i) => (
                <button
                    className={`page-item ${i + 1 == page && "active"}`}
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                >
                    {i + 1}
                </button>
            ))}
            <button
                className={`page-item ${groupCount >= (totalPageArray.length - 1) && "off"}`}
                onClick={() => {
                    makeGroup(groupCount + 1);
                }}
                disabled={groupCount >= (totalPageArray.length - 1)}
            >
                {">"}
            </button>

        </div>
    );
};

export default Pagination;