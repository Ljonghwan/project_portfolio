import React, { useMemo, useState } from "react";

import styles from "./index.module.css"

import { numFormat } from "@/libs/utils";
export default function ChartTable({ data=[] }) {
    


    return (
        <div style={{ width: "50%", background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div className={styles.chartTableHeader}>
                <p>항목 (실시간)</p>
                <p>수치</p>
                <p>변환율(어제 대비)</p>
            </div>

            <div className={styles.chartTableBody}>
                {data?.map((x, i) => { 
                    return (
                        <div key={i} className={styles.chartTableBodyItem}>
                            <p>{x?.title}</p>
                            <p>{x?.value}</p>
                            {x?.persent !== null && <p className={`${styles.infobox_persent} ${x?.persent === 0 ? styles.zero : x?.persent > 0 ? styles.add : styles.min}`}>{numFormat(Math.abs(x?.persent).toFixed(1))}</p>}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
