import React, { useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import Matter from 'matter-js';
import gsap from 'gsap';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { useDebounce } from "@/libs/utils";

import { useSize } from '@/store';

const boxRatio = 640/360;
const boxSize = {
    width: 400,
    height: 400 / boxRatio
}
const PortfolioFallingAnimation = ({ fallingBoxSize, list: portfolioData }) => {

    const navigate = useNavigate();

    const { size } = useSize();

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const engineRef = useRef(null);
    const renderRef = useRef(null);

    const draggingRef = useRef({
        isDragging: false,
        body: null,
        offset: { x: 0, y: 0 },
        lastPos: null,
        lastTime: null,
        velocity: { x: 0, y: 0 },
        startPos: null, // 드래그 시작 위치 저장
    });

    const debouncedWidth = useDebounce(size?.width, 200);

    // 상세보기 함수
    const handleDetailView = (project) => {
        navigate(`${routes.portpolio}/${project?.idx}`, { state: { in: true } });
        // alert(`Opening details for ${project.title}: ${project.description}`);
        // 여기에 상세보기 로직 추가 (예: 모달 띄우기, 페이지 이동 등)
    };

    useEffect(() => {
        // Matter.js 모듈
        const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Body } = Matter;

        // 엔진 및 렌더러 생성
        const engine = Engine.create();
        engineRef.current = engine;

        const render = Render.create({
            element: containerRef.current,
            canvas: canvasRef.current,
            engine: engine,
            options: {
                width: fallingBoxSize.width,
                height: fallingBoxSize.height,
                wireframes: false,
                background: 'transparent',
            },
        });
        renderRef.current = render;

        // 박스 배열을 미리 만들어둠
        const boxBodies = portfolioData.map((project, index) => {
            // 왼쪽(0.25) 또는 오른쪽(0.75) 기준으로 번갈아 배치, ±10% 랜덤 편차
            const baseX = index % 2 === 0 ? fallingBoxSize.width * 0.25 : fallingBoxSize.width * 0.75;
            const randomOffset = (Math.random() - 0.5) * (fallingBoxSize.width * 0.4); // ±10% 편차
            const x = baseX + randomOffset;
            const y = 10; // 모든 박스가 y=10에서 시작
            const box = Bodies.rectangle(
                x,
                y,
                boxSize.width,
                boxSize.height,
                {
                    restitution: 0.8, // 반발력 살짝만
                    friction: 0.6,
                    render: { sprite: { texture: null } },
                    portfolioData: project,
                    isSettled: false, // 추가!
                }
            );
            Body.setVelocity(box, { x: 0, y: 0 });
            Body.setAngularVelocity(box, 0);
            return box;
        });

        // 월드에 한 번에 추가하지 않고, 순차적으로 추가
        let current = 0;
        const addNextBox = () => {
            if (current >= boxBodies.length) return;
            World.add(engine.world, boxBodies[current]);
            // DOM에도 추가 (updateDOM에서 자동으로 추가됨)
            current++;
            setTimeout(addNextBox, 400); // 0.4초 간격
        };
        addNextBox();

        // 바닥 추가 (화면 하단에 고정)
        const ground = Bodies.rectangle(
            fallingBoxSize.width / 2,
            fallingBoxSize.height + 50,
            fallingBoxSize.width,
            100,
            { isStatic: true }
        );

        // 벽 추가 (화면 양쪽)
        const leftWall = Bodies.rectangle(
            -50,
            fallingBoxSize.height / 2,
            100,
            fallingBoxSize.height,
            { isStatic: true }
        );
        const rightWall = Bodies.rectangle(
            fallingBoxSize.width + 50,
            fallingBoxSize.height / 2,
            100,
            fallingBoxSize.height,
            { isStatic: true }
        );

        // 천장 추가 (화면 상단에 고정)
        const ceiling = Bodies.rectangle(
            fallingBoxSize.width / 2,
            -100, // 화면 위쪽(보이지 않는 곳)
            fallingBoxSize.width,
            200, // 두께 넉넉히
            { isStatic: true }
        );

        // 월드에 추가
        World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

        // 커스텀 DOM 렌더링
        const updateDOM = () => {
            const bodies = Matter.Composite.allBodies(engine.world);
            bodies.forEach((item) => {
                // 오직 portfolioData가 있는 바디만 DOM 처리
                if (!item.portfolioData) return;

                let domElement = document.getElementById(`portfolio-${item.portfolioData.idx}`);
                if (!domElement) {
                    // DOM 요소 생성
                    domElement = document.createElement('div');
                    domElement.id = `portfolio-${item.portfolioData.idx}`;
                    domElement.className = 'portfolio-box';
                    domElement.style.width = `${boxSize.width}px`;
                    domElement.style.aspectRatio = `${boxRatio}`;

                    let tags = item.portfolioData?.cate?.map((x, i) => {
                        return `<p>${x}</p>`;
                    })
                    tags = `<div class="tags">${tags?.join("")}</div>`;
                    domElement.innerHTML = `
                        <div class="bg">
                            <img class="bg_img" src="${item?.portfolioData?.thumb ? (consts.s3Url + item?.portfolioData?.thumb) : "/og.png"}" />
                            <div class="dim"></div>
                        </div>
                        <div class="bg_hover">
                            <img class="bg_img" src="${item?.portfolioData?.thumbBg ? (consts.s3Url + item?.portfolioData?.thumbBg) : '/og.png' }" />
                        </div>
                        <div class="data">
                            <div class="top">
                                <p class="title">${item.portfolioData?.title}</p>
                                <button class="portpolio_detail_btn" type="button"></button>
                            </div>
                            <div class="bottom">
                                ${tags}
                                <p>detail</p>
                            </div>
                        </div> 
                    `;
                    // mousedown 이벤트에서 클릭 여부 플래그 추가
                    domElement.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        if (item.isStatic) return;
                        draggingRef.current.isDragging = true;
                        draggingRef.current.body = item;
                        draggingRef.current.startPos = { x: e.clientX, y: e.clientY };
                        draggingRef.current.lastPos = { x: e.clientX, y: e.clientY };
                        draggingRef.current.lastTime = Date.now();
                        draggingRef.current.clicked = false; // 클릭 여부 플래그
                        draggingRef.current.clickedItem = item; // 클릭된 아이템 정보
                    });
                    containerRef.current.appendChild(domElement);

                    gsap.fromTo(
                        domElement,
                        { opacity: 0 },
                        { opacity: 1, duration: 1, ease: 'power2.out', delay: 0 }
                    );
                }
                domElement.style.transform = `translate(${item.position.x - boxSize.width / 2}px, ${item.position.y - boxSize.height / 2}px) rotate(${item.angle}rad)`;
            });
        };

        // 마우스 컨트롤 추가
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false },
            },
        });
        World.add(engine.world, mouseConstraint);

        // 애니메이션 루프
        const runAnimation = () => {
            Engine.update(engine, 1000 / 60);
            updateDOM();

            // 화면 밖으로 나간 박스 제거
            const bodies = Matter.Composite.allBodies(engine.world);
            bodies.forEach((item) => {
                if (item.portfolioData) {
                    const { x, y } = item.position;
                    if (
                        x < -boxSize.width ||
                        x > fallingBoxSize.width + boxSize.width ||
                        y < -boxSize.height ||
                        y > fallingBoxSize.height + boxSize.height
                    ) {
                        // Matter.js 월드에서 제거
                        Matter.World.remove(engine.world, item);
                        // DOM에서 제거
                        const domElement = document.getElementById(`portfolio-${item.portfolioData.idx}`);
                        if (domElement && domElement.parentNode) {
                            domElement.parentNode.removeChild(domElement);
                        }
                    }
                }
            });

            requestAnimationFrame(runAnimation);
        };
        runAnimation();

        // 캔버스 크기 조정
        const resizeCanvas = () => {
            render.canvas.width = fallingBoxSize.width;
            render.canvas.height = fallingBoxSize.height;
            Matter.Body.setPosition(ground, {
                x: fallingBoxSize.width / 2,
                y: fallingBoxSize.height + 50,
            });
            Matter.Body.setPosition(leftWall, { x: -50, y: fallingBoxSize.height / 2 });
            Matter.Body.setPosition(rightWall, { x: fallingBoxSize.width + 50, y: fallingBoxSize.height / 2 });
            Matter.Body.setPosition(ceiling, {
                x: fallingBoxSize.width / 2,
                y: -100,
            });
            Render.setSize(render, fallingBoxSize.width, fallingBoxSize.height);
        };
        window.addEventListener('resize', resizeCanvas);

        // 정리
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            World.clear(engine.world);
            Engine.clear(engine);
            Render.stop(render);
            render.canvas.remove();
        };
    }, [debouncedWidth]);

    // 전역 mousemove, mouseup 리스너 등록
    useEffect(() => {
        const onMouseMove = (e) => {
            if (draggingRef.current.isDragging && draggingRef.current.body) {
                const dx = e.clientX - draggingRef.current.startPos.x;
                const dy = e.clientY - draggingRef.current.startPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // 10px 이상 움직이면 튕기기
                if (dist > 10) {
                    const now = Date.now();
                    const dt = (now - draggingRef.current.lastTime) / 1000;
                    let vx = 0, vy = 0;
                    if (dt > 0) {
                        vx = (e.clientX - draggingRef.current.lastPos.x) / dt;
                        vy = (e.clientY - draggingRef.current.lastPos.y) / dt;
                    } else {
                        vx = dx * 5;
                        vy = dy * 5;
                    }
                    // 속도 계수 1.7배, 최소 속도 500
                    const minSpeed = 500;
                    let speed = Math.sqrt(vx * vx + vy * vy) * 1.7;
                    if (speed < minSpeed) {
                        const angle = Math.atan2(dy, dx);
                        vx = Math.cos(angle) * minSpeed;
                        vy = Math.sin(angle) * minSpeed;
                    } else {
                        vx *= 1.7;
                        vy *= 1.7;
                    }
                    Matter.Body.setVelocity(draggingRef.current.body, {
                        x: vx / 60,
                        y: vy / 60
                    });
                    // 회전도 같이 부여 (방향에 따라 랜덤 ±, 범위 축소)
                    const angular = (Math.random() - 0.5) * 0.25 * (vx > 0 ? 1 : -1);
                    Matter.Body.setAngularVelocity(draggingRef.current.body, angular);
                    draggingRef.current.isDragging = false;
                    draggingRef.current.body = null;
                    draggingRef.current.clicked = false; // 튕기면 클릭 아님
                }
                draggingRef.current.lastPos = { x: e.clientX, y: e.clientY };
                draggingRef.current.lastTime = Date.now();
            }
        };

        // mouseup에서 클릭 여부 판단
        const onMouseUp = () => {
            if (draggingRef.current.isDragging && draggingRef.current.body) {
                const dx = draggingRef.current.lastPos.x - draggingRef.current.startPos.x;
                const dy = draggingRef.current.lastPos.y - draggingRef.current.startPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= 10 && draggingRef.current.clickedItem) {
                    // 클릭 액션
                    handleDetailView(draggingRef.current.clickedItem.portfolioData);
                }
                draggingRef.current.isDragging = false;
                draggingRef.current.body = null;
                draggingRef.current.clicked = false;
                draggingRef.current.clickedItem = null;
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [debouncedWidth]);

    return (
        <div ref={containerRef} className='scene_container'>
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        </div>
    );
};

export default PortfolioFallingAnimation;