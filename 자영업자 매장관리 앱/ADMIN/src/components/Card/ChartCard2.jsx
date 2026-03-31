import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
    LineChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    DataZoomComponent,
    CanvasRenderer,
]);

/* ========================
   데이터 제너레이터
   ======================== */

// 최근 30일 DAU (일별)
function generateDAU(days = 30, base = 900) {
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);

        const idx = days - i;
        const wave = Math.sin((idx / days) * Math.PI * 2) * 120;
        const noise = Math.random() * 160 - 80;
        let value = base + wave + noise;

        // 이벤트 (예시): 스파이크/딥 1회씩
        if (idx === 10) value *= 2.0;
        if (idx === 17) value *= 0.55;

        result.push({
            date: d.toISOString().slice(0, 10), // YYYY-MM-DD
            value: Math.round(Math.max(200, value)),
        });
    }
    return result;
}

// 최근 12개월 MAU (월별)
function generateMAU(months = 12, base = 5000) {
    const result = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

        const idx = months - i;
        const wave = Math.sin((idx / months) * Math.PI * 2) * 800;
        const noise = Math.random() * 900 - 450;
        let value = base + wave + noise;

        // 이벤트 (예시)
        if (idx === 5) value *= 1.35; // 상승
        if (idx === 9) value *= 0.7;  // 하락

        result.push({
            month: d.toISOString().slice(0, 7), // YYYY-MM
            value: Math.round(Math.max(1000, value)),
        });
    }
    return result;
}

/* ========================
   차트 컴포넌트
   ======================== */

export default function ChartCard2({ mode, setMode, data=[] }) {
    

    // 한 번만 생성(렌더마다 값이 바뀌지 않도록)
    const dauData = useMemo(() => generateDAU(), []);
    const mauData = useMemo(() => generateMAU(), []);

    // 모드 전환에 따라 x/y 구성
    const { x, y, xLabel, title } = useMemo(() => {
        if (mode === "DAU") {
            return {
                x: data.map(d => d.date),     // YYYY-MM-DD
                y: data.map(d => d.value),
                xLabel: "최근 30일",
                title: "일일 활성 사용자 (DAU)",
            };
        }
        return {
            x: data.map(m => m.month),      // YYYY-MM
            y: data.map(m => m.value),
            xLabel: "최근 12개월",
            title: "월간 활성 사용자 (MAU)",
        };
    }, [mode, data]);

    const option = {
        color: ["#EA6A1F"],
        grid: { left: 24, right: 16, top: 40, bottom: 24, containLabel: true },
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "line" },
            valueFormatter: (v) => (typeof v === "number" ? v.toLocaleString() : String(v)),
            backgroundColor: "rgba(255,255,255,0.95)",
            borderColor: "#f1f1f3",
            borderWidth: 1,
            textStyle: { color: "#111" },
            formatter: (params) => {
                const p = params[0];
                // DAU는 YYYY-MM-DD, MAU는 YYYY-MM
                return `${p.axisValue}<br/><b>${p.value.toLocaleString()}</b>`;
            },
        },
        xAxis: {
            type: "category",
            data: x,
            boundaryGap: false,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#6b7280" },
        },
        yAxis: {
            type: "value",
            splitNumber: 5,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: "#6b7280",
                formatter: (v) => v.toLocaleString(),
            },
            splitLine: { lineStyle: { type: "dashed", color: "#EDEFF3" } },
        },
        series: [
            {
                name: mode,
                type: "line",
                symbol: "circle",
                symbolSize: 6,
                showSymbol: true,
                data: y,
                lineStyle: { width: 2, color: "#EA6A1F" },
                itemStyle: {
                    color: "#EA6A1F",
                    borderWidth: 1,
                    borderColor: "#fff",
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: "rgba(234,106,31,0.25)" },
                        { offset: 1, color: "rgba(234,106,31,0.06)" },
                    ]),
                },
                emphasis: {
                    focus: "series",
                    itemStyle: { borderWidth: 2, borderColor: "#EA6A1F" },
                },
            },
        ],
    };

    return (
        <div style={{ width: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: 30 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                    {title}
                    {/* <span style={{ color: "#9ca3af", fontWeight: 500 }}>· {xLabel}</span> */}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setMode("DAU")}
                        style={{
                            padding: "6px 37px",
                            border: "1px solid #F4E3D9",
                            background: mode === "DAU" ? "#EA6A1F" : "#fff",
                            color: mode === "DAU" ? "#fff" : "#EA6A1F",
                            fontSize: 12,
                            cursor: "pointer",
                        }}
                    >
                        DAU
                    </button>
                    <button
                        onClick={() => setMode("MAU")}
                        style={{
                            padding: "6px 37px",
                            border: "1px solid #F4E3D9",
                            background: mode === "MAU" ? "#EA6A1F" : "#fff",
                            color: mode === "MAU" ? "#fff" : "#EA6A1F",
                            fontSize: 12,
                            cursor: "pointer",
                        }}
                    >
                        MAU
                    </button>
                </div>
            </div>

            <div style={{ padding: 8 }}>
                <ReactECharts
                    option={option}
                    style={{ width: "100%", heigh: 380}}
                    notMerge
                    lazyUpdate
                />
            </div>
        </div>
    );
}
