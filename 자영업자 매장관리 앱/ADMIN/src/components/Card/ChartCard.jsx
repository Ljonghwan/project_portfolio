import React from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";

import CardBox from "./CardBox";
import styles from "./index.module.css"

import {
    LineChart
} from "echarts/charts";

import {
    GridComponent,
    TooltipComponent,
    DataZoomComponent
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

// 6시간 전부터 현재까지 분단위 타임스탬프 생성
function generateMinuteStamps(minutes = 360) {
    const result = [];
    const now = Math.floor(Date.now() / 60000) * 60000;
    const start = now - minutes * 60 * 1000;  // 6시간 전부터 시작
    
    for (let i = 0; i < minutes; i++) {
        result.push(start + i * 60 * 1000);
    }
    return result;
}

// 리니어 + 사인곡선 + 노이즈
function generateSmoothSeries(
    n = 360,
    start = 100,
    end = 500,
    noise = 20,
    waves = 2 // 몇 번의 파도(곡선)를 넣을지
) {
    const data = [];
    const step = (end - start) / n;

    for (let i = 0; i < n; i++) {
        const linear = start + step * i; // 기본 상승/하락 추세

        // 사인 웨이브로 부드러운 곡선 추가
        const wave = Math.sin((i / n) * Math.PI * waves) * (step * n * 0.1);

        // 랜덤 노이즈
        const randomNoise = Math.random() * noise * 2 - noise;

        const value = linear + wave + randomNoise;
        data.push(Math.round(value));
    }

    return data;
}


const a = generateSmoothSeries(360, 200, 900, 20, 9); // 2번의 완만한 곡선
const b = generateSmoothSeries(360, 100, 500, 25, 3);
const c = generateSmoothSeries(360, 20, 200, 10, 6);

const stamps = generateMinuteStamps(360);
// const seriesA = stamps.map((t, i) => [t, a[i]]);
const seriesB = stamps.map((t, i) => [t, b[i]]);
const seriesC = stamps.map((t, i) => [t, c[i]]);
export default function ChartCard(props) {
    const {
        style,
        title,
        message,
        persent,
        seriesA,
        seriesB,
        seriesC
    } = props;

    const option = {
        color: ["#8177EE", "#2216A9", "#C0D5DE"], // 차트 기본 색
        grid: { left: 24, right: 16, top: 16, bottom: 24, containLabel: true },
        tooltip: { trigger: "axis" },
        dataZoom: [
            {
                type: "inside",
                xAxisIndex: 0,
                // 휠/드래그 동작 튜닝
                zoomOnMouseWheel: true,    // 휠로 줌
                moveOnMouseWheel: false,   // 휠로 팬은 비활성(원하면 true)
                moveOnMouseMove: true,     // 드래그로 팬
                throttle: 50,
                filterMode: "none"         // 데이터 클리핑 방지(원하면 "filter")
            },
            // (선택) 하단 슬라이더도 쓰고 싶으면 하나 더:
            // { type: "slider", height: 14, bottom: 0 }
        ],
        xAxis: {
            type: "time",
            axisLabel: {
                formatter: "{HH}:{mm}",
            },
            minInterval: 60 * 60 * 1000, // 1시간 간격 라벨
            boundaryGap: false,
        },
        yAxis: {
            type: "value",
            min: 0,
            splitNumber: 6,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#666" },
            splitLine: { lineStyle: { type: "dashed", color: "#E6E8EF" } },
        },
        series: [
            {
                name: "활성사용자",
                type: "line",
                // smooth: true,
                symbol: "none",
                data: seriesA,
                lineStyle: { width: 2 }
            },
            {
                name: "게시글 작성",
                type: "line",
                // smooth: true,
                symbol: "none",
                data: seriesB,
                lineStyle: { width: 2 }
            },
            {
                name: "댓글 작성",
                type: "line",
                // smooth: true,
                symbol: "none",
                data: seriesC,
                lineStyle: { width: 2, opacity: 0.35 }
            }
        ],
        // 휠 확대/드래그 확대를 원하면 dataZoom 켜기 (옵션)
        // 스샷 느낌 유지엔 필요 없지만, 확대 원하면 주석 해제하세요.
        // dataZoom: [
        //   { type: "inside", throttle: 50 },
        //   { type: "slider", height: 14, bottom: 0 }
        // ]
    };

    return <CardBox style={style} className={styles.m}>
        <p style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 30
        }}>{title}</p>
        <ReactECharts
            option={option}
            style={{ width: "100%", height: "100%" }}
            notMerge
            lazyUpdate
        />
    </CardBox>
}