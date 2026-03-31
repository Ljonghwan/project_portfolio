import React, { useEffect, useRef } from 'react';
import Matter, { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint, Composite } from 'matter-js';
import { useNavigate } from 'react-router-dom';

import routes from "@/libs/routes";
import { useSize } from '@/store';

const GravityList = ({ list = [] }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const engineRef = useRef(null);
    const renderRef = useRef(null);
    const runnerRef = useRef(null);
    const navigate = useNavigate();
    const { size } = useSize();

    const measureTextSize = (text, type) => {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.fontSize = type == 'title' ? '50px' : '34px';
        tempDiv.style.fontWeight = type == 'title' ? '600' : '300';
        tempDiv.style.whiteSpace = 'nowrap';
        tempDiv.textContent = text;
        document.body.appendChild(tempDiv);
        const { width, height } = tempDiv.getBoundingClientRect();
        document.body.removeChild(tempDiv);
        return { width: width, height: height };
    };

    const resetSimulation = () => {
        if (runnerRef.current) {
            Runner.stop(runnerRef.current);
            runnerRef.current = null;
        }
        if (renderRef.current) {
            Render.stop(renderRef.current);
            if (renderRef.current.canvas) {
                renderRef.current.canvas.remove();
                renderRef.current.canvas = null;
            }
            renderRef.current = null;
        }
        if (engineRef.current) {
            World.clear(engineRef.current.world);
            Engine.clear(engineRef.current);
            engineRef.current = null;
        }

        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width === 0 || height === 0) return;

        const engine = Engine.create();
        const render = Render.create({
            canvas: canvasRef.current,
            engine,
            options: {
                width,
                height,
                wireframes: false,
                background: 'transparent',
            },
        });

        const wallOptions = { isStatic: true, render: { fillStyle: 'transparent' } };
        const walls = [
            Bodies.rectangle(width / 2, height, width, 10, wallOptions), // Bottom
            Bodies.rectangle(0, height / 2, 10, height, wallOptions), // Left
            Bodies.rectangle(width, height / 2, 10, height, wallOptions), // Right
        ];
        World.add(engine.world, walls);

        const items = [];
        list.forEach((item, index) => {
            // Create three falling objects per item
            for (let i = 0; i < item?.cate?.length + 1; i++) {
                const text = (i === 0 ? item.title : item?.cate?.[i - 1]);

                const { width: itemWidth, height: itemHeight } = measureTextSize(text, i === 0 ? 'title' : false);

                const x = Math.random() * (width - itemWidth - 20) + itemWidth / 2 + 10;
                const y = -itemHeight - (index * 3 + i) * (itemHeight + 20); // Staggered initial positions
                const body = Bodies.rectangle(x, y, itemWidth, itemHeight, {
                    restitution: 0.5,
                    friction: 0.2,
                    frictionAir: 0.02,
                    render: {
                        fillStyle: '#fff',
                    },
                    plugin: {
                        itemData: { ...item, instanceId: `${item.idx}-${i}` }, // Unique ID for each instance
                        width: itemWidth,
                        height: itemHeight
                    },
                });
                items.push(body);
            }
        });

        World.add(engine.world, items);

        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false },
            },
        });
        World.add(engine.world, mouseConstraint);

        Matter.Events.on(mouseConstraint, 'mouseup', (event) => {
            const mousePosition = event.mouse.position;
            const body = Matter.Query.point(items, mousePosition)[0];
            if (body && body.plugin.itemData) {
                navigate(`${routes.portpolio}/${body.plugin.itemData.idx || ''}`, { state: { in: true } });
            }
        });

        const runner = Runner.create();
        Runner.run(runner, engine);
        Render.run(render);

        engineRef.current = engine;
        renderRef.current = render;
        runnerRef.current = runner;
    };

    useEffect(() => {
        resetSimulation();

        const handleResize = () => {
            resetSimulation();
        };

        return () => {
            if (runnerRef.current) Runner.stop(runnerRef.current);
            if (renderRef.current) {
                Render.stop(renderRef.current);
                if (renderRef.current.canvas) renderRef.current.canvas.remove();
            }
            if (engineRef.current) {
                World.clear(engineRef.current.world);
                Engine.clear(engineRef.current);
            }
        };
    }, []); // Re-run simulation when list changes

    useEffect(() => {
        if (!engineRef.current || !renderRef.current) return;

        const updateDOM = () => {
            const bodies = Composite.allBodies(engineRef.current.world).filter(
                (body) => body.plugin && body.plugin.itemData
            );
            bodies.forEach((body) => {
                const elem = document.getElementById(`item-${body.plugin.itemData.instanceId}`);
                if (elem) {
                    const { x, y } = body.position;
                    const angle = body.angle;
                    const { width, height } = body.plugin;
                    elem.style.transform = `translate(${x - width / 2}px, ${y - height / 2}px) rotate(${angle}rad)`;
                    elem.style.width = `${width}px`;
                    elem.style.height = `${height}px`;
                    elem.style.borderRadius = `25px`;
                }
            });
        };

        requestAnimationFrame(updateDOM);
        Matter.Events.on(engineRef.current, 'afterUpdate', updateDOM);

        return () => {
            Matter.Events.off(engineRef.current, 'afterUpdate', updateDOM);
        };
    }, [size]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: -1 }}>
            <div
                ref={containerRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: -1,
                        pointerEvents: 'none', // Enable mouse interaction
                    }}
                />
                {list?.map((item, index) =>
                    Array.from({ length: item?.cate?.length + 1 }, (_, i) => {
                        const text = (i === 0 ? item.title : item?.cate?.[i - 1]);

                        const { width, height } = measureTextSize(text, i === 0 ? 'title' : false);
                        const instanceId = `${item.idx}-${i}`;
                        return (
                            <div
                                key={instanceId}
                                id={`item-${instanceId}`}
                                style={{
                                    position: 'absolute',
                                    width: `${width}px`,
                                    height: `${height}px`,
                                    textAlign: 'center',
                                    lineHeight: `${height}px`,
                                    color: i > 0 ? '#fff' : '#000',
                                    backgroundColor: i > 0 ? '#000' : '#fff',
                                    borderRadius: 25,
                                    fontSize: i > 0 ? '24px' : '50px',
                                    fontWeight: i > 0 ? 300 : 600,
                                    pointerEvents: 'none',
                                    zIndex: 1,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {text}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default GravityList;