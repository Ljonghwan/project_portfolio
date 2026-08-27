import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { toast } from 'react-toastify';


import InfoCard from "@/components/Card/InfoCard";
import ChartCard from "@/components/Card/ChartCard";
import ChartCard2 from "@/components/Card/ChartCard2";
import ChartTable from "@/components/Card/ChartTable";
import Loading from "@/components/Loading";

import API from "@/libs/api";
import consts from "@/libs/consts";

import { numFormat, fillEmptyMinutes, fillEmptyDays, fillEmptyMonths, useInterval } from "@/libs/utils";

const styles = {
    cardSmalBox: {
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        marginTop: 20,
    },
    cardSmalItem: { width: "calc(100% / 4 - 18px)" },
    cardMediumBox: {
        display: "flex",
        width: "100%",
        gap: 15,
        marginTop: 30,
    },
    cardMediumItem: {
        width: "50%"
    },

    cardLargeBox: {
        display: "flex",
        width: "100%",
        marginTop: 30,
    },
    cardLargeItem: {
        width: "100%"
    },
}
export default function DashBoard() {


    const [data, setData] = useState(null);
    const [dataDau, setDataDau] = useState([]);

    const [mode, setMode] = useState("DAU");

    const [initLoad, setInitLoad] = useState(true);

    useEffect(() => {
        loadData(true);
    }, [])

    useEffect(() => {
        loadDataDau();
    }, [mode])

    useInterval(() => {
        loadData(false);
    }, 60000)

    async function loadData(reset = false) {

        if (reset) {
            setInitLoad(true);
        }

        const { data, error } = await API.post('/admin/dashboard');

        console.log('data', data?.trackings, error)

        setData(data || null);
        

        setTimeout(() => {
            setInitLoad(false);
        }, consts.apiDelay)

    }
    
    async function loadDataDau() {
        
        let sender = {
            type: mode === "DAU" ? 1 : 2,
        }
        const { data, error } = await API.post('/admin/dashboard/dau', sender);
        setDataDau(data || []);
    }


    return (
        <div className="box">
            {initLoad && (<Loading />)}

            <div className="page_contain grey">
                <div className="page_title_box" >
                    <p>Today 리포트</p>
                </div>

                <div style={styles.cardSmalBox}>
                    <InfoCard
                        style={styles.cardSmalItem}
                        title="총 회원 수"
                        message={numFormat(data?.userCount) +`명`}
                    />
                    <InfoCard
                        style={styles.cardSmalItem}
                        title="일일 신규 가입자"
                        message={numFormat(data?.userTodayCount) +`명`}
                    />
                    <InfoCard
                        style={styles.cardSmalItem}
                        title="등록 매장 수"
                        message={numFormat(data?.storeCount) +`개`}
                    />
                    <InfoCard
                        style={styles.cardSmalItem}
                        title="여신금융협회 연동 매장수"
                        message={numFormat(data?.storeCardSalesMemberCount) +`개`}
                    />
                    <InfoCard
                        style={styles.cardSmalItem}
                        title="커뮤니티 게시글 수"
                        message={numFormat(data?.boardCount) +`건`}
                        count={Number(data?.boardCount - data?.boardPrevDayCount)}
                    />
                    <InfoCard
                        style={styles.cardSmalItem}
                        title="댓글 작성 수"
                        message={numFormat(data?.replyCount) +`건`}
                        count={Number(data?.replyCount - data?.replyPrevDayCount)}
                    />

                    <InfoCard
                        style={styles.cardSmalItem}
                        title="OCR 처리 건 수"
                        message={numFormat(data?.ocrCount) +`건`}
                        count={Number(data?.ocrCount - data?.ocrPrevDayCount)}
                    />
                    <InfoCard
                        style={styles.cardSmalItem}
                        title="신고 심사 대기"
                        message={numFormat(data?.reportCount) +`건`}
                    />
                </div>

                <div style={styles.cardMediumBox}>
                    <ChartCard 
                        style={styles.cardMediumItem} 
                        title="실시간 참여/운영 현황" 
                        seriesA={fillEmptyMinutes(data?.trackings, 360) } 
                        seriesB={fillEmptyMinutes(data?.boardTrackings, 360) } 
                        seriesC={fillEmptyMinutes(data?.replyTrackings, 360) } 
                    />

                    <ChartTable 
                        data={[
                            { 
                                title: '활성 사용자', 
                                value: data?.liveTrackingCount, 
                                persent: data?.prevLiveTrackingCount > 0 ? ((data?.liveTrackingCount - data?.prevLiveTrackingCount) / data?.prevLiveTrackingCount * 100) : 0
                            },
                            { 
                                title: '커뮤니티 게시글', 
                                value: data?.liveTrackingBoardCount, 
                                persent: data?.prevLiveTrackingBoardCount > 0 ? ((data?.liveTrackingBoardCount - data?.prevLiveTrackingBoardCount) / data?.prevLiveTrackingBoardCount * 100) : 0
                            },
                            { 
                                title: '커뮤니티 댓글', 
                                value: data?.liveTrackingReplyCount, 
                                persent: data?.prevLiveTrackingReplyCount > 0 ? ((data?.liveTrackingReplyCount - data?.prevLiveTrackingReplyCount) / data?.prevLiveTrackingReplyCount * 100) : 0
                            },
                        ]}
                    />

                </div>
               

                <div style={styles.cardLargeBox}>
                    <ChartCard2 
                        style={styles.cardLargeItem} 
                        mode={mode}
                        setMode={setMode}
                        data={mode === "DAU" ? fillEmptyDays(dataDau) : fillEmptyMonths(dataDau)}
                    />
                </div>
            </div >
        </div>
        
    )

}