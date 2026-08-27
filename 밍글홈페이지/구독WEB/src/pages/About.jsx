import { useEffect, useRef, useState, useId } from 'react'
import { useNavigate } from 'react-router-dom';
import { SsgoiTransition } from "@ssgoi/react";

import Marquee from "react-fast-marquee";
import * as motion from "motion/react-client"

import Image from "@/components/Image";
import Video from "@/components/Video";

import { EnterDiv, EnterP, Enterli, EnterTag } from "@/components/EnterMotion";

import routes from "@/libs/routes";
import images from "@/libs/images";
import videos from "@/libs/videos";

import consts from "@/libs/consts";

import { partners1, partners2 } from "@/libs/partners";

import API from "@/libs/api";

import { splitIntoThree } from "@/libs/utils";

import { useSize } from '@/store';

export default function Page() {

    const navigate = useNavigate();

    const { size } = useSize();

    const stacks = useRef(null)

    useEffect(() => {


    }, []);

    return (
        <div className='container'>

            <div className='about_banner'>
                <Video src={videos.banner} className='banner_video'/>
               
                <div className='content'>
                    <Image src={images.quotation_start} className='quotation'/>
                    <div className='banner_text' style={{ gap: 14 }}>
                        <EnterP delay={0.2} className='title'>사용자가 <span>머무는 이유</span>를 만드는 팀, 밍글</EnterP>
                        <EnterP delay={0.4} className='comment'>우리는 단순한 인터페이스가 아닌, 사용자에게 기억되는 ‘디지털 경험’을 설계합니다. <br />즐겁게, 믿을 수 없게, 크리에이티브하게 — 그것이 밍글의 방식입니다.</EnterP>
                    </div>
                    <Image src={images.quotation_end} className='quotation'/>
                </div>
            </div>
            <div className='about_label'>
                <p>밍글은 사람이 ‘<span>경험하고 싶어지는 디지털 공간</span>’을 만듭니다.</p>
            </div>

            <div className='abouts'>
                <div className='title_box'>
                    <EnterP delay={0.2} className='label'>Why?</EnterP>
                    <EnterP delay={0.4} className='title'>디지털을 넘어, 경험의 본질을 추구합니다</EnterP>
                </div>
                <ul className='about_ul'>
                    <Enterli>
                        <img src={images.about_01} alt={consts.imgAlt} />
                        <p className='title'>유연한 사고, <br />즐거운 결과</p>
                        <p className='comment'>기술적 문제를 해결할 때도 유연한 사고를 최우선으로 합니다. 팀원 간 효율적인 협업과 다양한 접근 방식을 통해, 예상치 못한 상황에서도 안정적이고 만족스러운 개발 결과를 만들어냅니다.</p>
                    </Enterli>
                    <Enterli delay={0.2}>
                        <img src={images.about_02} alt={consts.imgAlt} />
                        <p className='title'>검증된 프로세스로 <br />신뢰할 수 있는 결과</p>
                        <p className='comment'>개발 단계에서부터 테스트와 검증을 철저히 수행합니다. 코드 품질과 안정성을 최우선으로 하여, 고객이 안심하고 의존할 수 있는 완성도 높은 결과물을 제공합니다.</p>
                    </Enterli>
                    <Enterli delay={0.4}>
                        <img src={images.about_03} alt={consts.imgAlt} />
                        <p className='title'>직관적인 인터페이스와 <br />안정적인 개발</p>
                        <p className='comment'>사용자 친화적이면서도 기술적으로 안정적인 화면 구현을 지향합니다. 효율적인 프론트엔드·백엔드 연동 및 최적화된 코드로, 사용자와 클라이언트 모두 만족할 수 있는 완성도 높은 경험을 제공합니다.</p>
                    </Enterli>
                    <Enterli delay={0.6}>
                        <img src={images.about_04} alt={consts.imgAlt} />
                        <p className='title'>안정성과 확장성을 <br />고려한 서버 구축</p>
                        <p className='comment'>저희는 효율적이고 안전한 서버 구조를 구현합니다. 트래픽 변화에도 흔들리지 않는 아키텍처와 철저한 운영 관리로, 안정적이고 신뢰할 수 있는 서비스 환경을 제공합니다.</p>
                    </Enterli>
                    <Enterli delay={0.8}>
                        <img src={images.about_05} alt={consts.imgAlt} />
                        <p className='title'>지속 가능한 운영을 <br />위한 서비스 제공</p>
                        <p className='comment'>밍글은 프로젝트 개발 구현 이후에도 서비스를 책임집니다. 발생 가능한 모든 이슈에 신속하게 대응하며, 정기적인 점검과 개선을 통해 안정적이고 지속 가능 서비스를 제공합니다.</p>
                    </Enterli>
                </ul>
            </div>

            <div className='abouts'>
                <div className='title_box'>
                    <EnterP delay={0.2} className='label'>We are,</EnterP>
                    <EnterP delay={0.4} className='title'>프로젝트에 가장 적합한 기술 스택을 제안합니다</EnterP>
                </div>
                <div className='stacks'>
                    {consts?.tags?.map((x, i) => {
                        return (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.6 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{
                                    duration: 0.3,
                                    delay: (i * 0.1),
                                }}
                                viewport={{
                                    once: true,
                                    amount: 'some',
                                    margin: '200px', 
                                }}
                                key={i} 
                                className='stack' 
                                style={{ backgroundColor: x?.backgroundColor || '#333' }}
                            >
                                <Image src={x?.icon} className={x?.className} />
                                <p style={{ color: x?.color || '#fff' }}>{x?.key}</p>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            <div className='bottom_banner'>
                <div className='title_box'>
                    <p className='title'>합리적인 비용의 구독형 개발 서비스를 경험해 보세요.</p>
                    <p className='comment'>Your next great idea deserves the right team! — let’s mingle.</p>
                </div>

                <div className='submit2' onClick={() => {
                    navigate(routes.counseling);
                }} data-cursor-size="0px">
                    <p>구독 문의하기</p>
                    <img src={images.right5} alt={consts.imgAlt} />
                </div>

            </div>
        </div>
    )
}