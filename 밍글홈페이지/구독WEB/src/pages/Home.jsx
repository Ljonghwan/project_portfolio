import { useEffect, useRef, useState, useId } from 'react'
import { useNavigate } from 'react-router-dom';
import { SsgoiTransition } from "@ssgoi/react";

import Marquee from "react-fast-marquee";
import { motion, AnimatePresence } from 'framer-motion';

import ToggleButtons from "@/components/ToggleButtons";
import Image from "@/components/Image";
import { EnterDiv, EnterP, Enterli, EnterTag } from "@/components/EnterMotion";

import routes from "@/libs/routes";
import images from "@/libs/images";
import consts from "@/libs/consts";
import { partners1, partners2 } from "@/libs/partners";

import API from "@/libs/api";

import { splitIntoThree } from "@/libs/utils";

export default function Page() {

    const navigate = useNavigate();

    const [activeIndex, setActiveIndex] = useState(0);
    const [portpolioMode, setPortpolioMode] = useState({ key: 'WEB' });

    const [portpolio1, setPortpolio1] = useState([]);
    const [portpolio2, setPortpolio2] = useState([]);
    const [portpolio3, setPortpolio3] = useState([]);

    const [selected, setSelected] = useState(null);

    const sectionRefs = useRef([]);

    useEffect(() => {

        dataFunc();

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = sectionRefs.current.indexOf(entry.target);
                        setActiveIndex(index);
                    }
                });
            },
            {
                threshold: 0.2, // 섹션의 50%가 보일 때 활성화
                rootMargin: '-20% 0px -20% 0px' // 상하 20% 여백
            }
        );

        sectionRefs.current.forEach((section) => {
            if (section) observer.observe(section);
        });

        return () => {
            sectionRefs.current.forEach((section) => {
                if (section) observer.unobserve(section);
            });
        };
    }, []);

    const dataFunc = async () => {

        const { data, error } = await API.post('/v1/portpolio');
        console.log('portpolio', data);

        const result = splitIntoThree(data?.list?.filter((x, i) => x?.thumbVideo && i < 13));

        setPortpolio1(result?.first || []);
        setPortpolio2(result?.second || []);
        setPortpolio3(result?.third || []);

    }

    const scrollToSection = (index) => {
        sectionRefs.current[index]?.scrollIntoView({
            behavior: 'smooth',
        });
    };

    return (
        <>
            <div className='container'>
                <div className='banner'>
                    <div className='banner_text'>
                        <EnterDiv className='tag'>
                            <p className=''>개발팀 구독<span>이란?</span></p>
                        </EnterDiv>
                        <EnterP delay={0.2} className='title'>채용보다 빠르고, <br />외주보다 유연한 <span>개발자 매칭</span></EnterP>
                        <EnterP delay={0.4} className='comment'>프로젝트 이해도와 커뮤니케이션 능력을 갖춘 전문 개발자를 빠르게 연결합니다. <br />단순 투입이 아닌, 품질과 일정에 집중하는 실무 중심 매칭을 제공합니다.</EnterP>
                        <EnterDiv delay={0.6} className='submit' onClick={() => { navigate(routes.counseling) }} data-cursor-size="0px">
                            <p>구독 문의하기</p>
                            <img src={images.right} alt={consts.imgAlt} />
                        </EnterDiv>
                    </div>

                    <Image src={images.cone_01} className='banner_cone banner_cone1' />
                    <Image src={images.cone_02} className='banner_cone banner_cone2' />
                    <Image src={images.cone_03} className='banner_cone banner_cone3' />
                </div>

                <div className='info'>
                    <ul className='lnb'>
                        <li data-cursor-size="0px" className={activeIndex === 0 ? 'active' : ''} onClick={() => scrollToSection(0)}>1. 서비스 소개</li>
                        {/* <li className={activeIndex === 1 ? 'active' : ''} onClick={() => scrollToSection(1)}>1 외주 개발 비교</li> */}
                        <li data-cursor-size="0px" className={activeIndex === 1 ? 'active' : ''} onClick={() => scrollToSection(1)}>2. 작업 진행 프로세스</li>
                        <li data-cursor-size="0px" className={activeIndex === 2 ? 'active' : ''} onClick={() => scrollToSection(2)}>3. 구독 플랜</li>
                        <li data-cursor-size="0px" className={activeIndex === 3 ? 'active' : ''} onClick={() => scrollToSection(3)}>4. 추천 고객</li>
                    </ul>

                    <div>
                        <div ref={(el) => (sectionRefs.current[0] = el)} className='info_section info_section_intro'>
                            <div className='text_box'>
                                <EnterP delay={0.2} className='label'>About</EnterP>
                                <EnterP delay={0.4} className='title'>오늘 필요한 개발자, <br /><span>내일 바로 투입</span></EnterP>
                                <EnterP delay={0.6} className='comment'>채용 공고, 서류 검토, 면접, 처우 협상... <span>개발자 한 명 뽑는 데만 몇 달</span>이 걸립니다. <br />구독 서비스는 <span>이미 검증된 개발자를</span> 즉시 배정받아, 채용에 쓸 시간을 <span>실제 개발에 투자</span>할 수 있습니다.</EnterP>
                            </div>
                            <div className='content'>
                                <EnterDiv amount={'some'} delay={0.6} className='left'>
                                    <p className='title'>정규직 시니어</p>
                                    <div className='gradient_box2'>
                                        <div className='gradient_box3'>
                                            <p>연봉: <span className='highlight2'>8,000만원 이상</span></p>
                                            <p>채용 기간: <span className='highlight2'>2~3개월</span></p>
                                            <p>세금 및 4대보험 + 퇴직금 + 채용 = <br /><span className='highlight2'>연 9,000만원 이상 (월 752만원)</span></p>
                                            <p>단점: <span className='highlight2'>불필요한 교육비, 인력 재배치의 제약, 지연된 프로젝트 일정, 복리후생비 별도</span></p>
                                            <img src={images.profile1} style={{ bottom: -40 }} />
                                        </div>

                                    </div>
                                </EnterDiv>

                                <EnterDiv amount={'some'} delay={0.8} className='right'>
                                    <p className='title'>구독 시니어</p>
                                    <div className='gradient_box'>
                                        <div className='gradient_box3'>
                                            <p><span className='highlight'>월 300만원</span></p>
                                            <p>채용 기간: <span className='highlight'>즉시 시작</span></p>
                                            <p>세금 및 4대보험 + 퇴직금 + 채용 = <br /><span className='highlight'>필요할 때만, 고정비 없이</span></p>
                                            <p>장점: <span className='highlight'>팀 프로젝트에 효율적, 일정 맞춤 소화, 필요 시 다음 달 조정 가능</span></p>
                                            <img src={images.profile2} className='' />
                                        </div>
                                    </div>
                                </EnterDiv>
                            </div>

                            <div className='text_box'>
                                <EnterP delay={0.2} className='title'>속도에 쫓기는 외주가 아닌, <br /><span>퀄리티에 집중하는 구독</span></EnterP>
                                <EnterP delay={0.4} className='comment'>
                                    밍글의 개발팀 구독은 <span>임직원 모두 개발자인 효율적 구조</span>로, <br />장기적 관계를 통해 <span>진짜 퀄리티에 집중</span>합니다.
                                </EnterP>

                                {/* <p className='comment'>
                                        외주개발사는 회전율이 생명입니다. 빠르게 납품하고 다음 프로젝트로 넘어가야 하니 퀄리티는 타협될 수밖에 없죠.<br/>
                                        게다가 대표, 영업 인력 등 <span>불필요한 비용까지 견적에 포함</span>됩니다.<br/>
                                        밍글의 개발팀 구독은 <span>임직원 모두 개발자인 효율적 구조</span>로, 장기적 관계를 통해 <span>진짜 퀄리티에 집중</span>합니다.
                                    </p>

                                    <p className='comment'>
                                        채용은 부담스럽고, <span>외주 개발사</span>는 어떨까요?<br/>
                                        외주개발사는 회전율이 생명입니다. <span>빠르게 납품하고 다음 프로젝트를 받아야 회사가 유지</span>되죠.<br/>
                                        납품 기한에 쫓기다 보면 <span>디테일과 퀄리티는 뒷전</span>이 되기 쉽습니다.<br/>
                                        게다가 프로젝트 비용에는 대표나 영업 인력의 인건비 등 <span>불필요한 비용까지 포함</span>되어 있습니다.<br/><br/>
                                        구독 서비스는 <span>순수 개발 인력에만 집중된 효율적인 비용 구조</span>이며,<br />
                                        <span>장기적 관계</span>를 전제하기에 <span>제대로 된 퀄리티에 집중</span>할 수 있습니다.
                                    </p> */}
                            </div>
                            <div className='content'>
                                <EnterDiv amount={'some'} delay={0.4} className='left'>
                                    <p className='title'>외주 개발사</p>
                                    <div className='gradient_box2'>
                                        <div className='gradient_box3'>
                                            <p>개발 기간: <span className='highlight2'>2개월</span></p>
                                            <p>비용: <span className='highlight2'>평균 3,000만원</span></p>
                                            {/* <p>단점: <span className='highlight2'>빠른 납품이 목표, 퀄리티 타협, 대표·영업팀 인건비 포함된 높은 비용, 납품 후 유지보수 회피</span></p> */}
                                            <p><span className='highlight2'>빠른 납품</span>이 목표</p>
                                            <p>속도에 쫓겨 <span className='highlight2'>퀄리티 타협</span></p>
                                            <p>대표·영업팀 인건비 포함된 <span className='highlight2'>높은 비용</span></p>
                                            <p>납품 후 <span className='highlight2'>유지보수 회피</span></p>
                                            <p>추가개발시 <span className='highlight2'>높은 비용 재발생</span></p>
                                            <img src={images.profile1} style={{ bottom: -40 }} />
                                        </div>

                                    </div>
                                </EnterDiv>

                                <EnterDiv amount={'some'} delay={0.6} className='right'>
                                    <p className='title'>개발팀 구독</p>
                                    <div className='gradient_box'>
                                        <div className='gradient_box3'>
                                            <p>개발 기간: <span className='highlight'>2개월</span></p>
                                            <p>비용: <span className='highlight'>Plus기준 1,000만원</span></p>
                                            <p>장기 관계 전제로 <span className='highlight'>디테일 집중</span></p>
                                            <p>제대로 된 <span className='highlight'>퀄리티가 목표</span></p>

                                            <p><span className='highlight'>순수 개발 인력 비용</span></p>
                                            <p>유지보수도, 추가개발도 <span className='highlight'>효율적인 비용</span></p>

                                            <img src={images.profile2} className='' />
                                        </div>
                                    </div>
                                </EnterDiv>
                            </div>

                        </div>

                        <div ref={(el) => (sectionRefs.current[1] = el)} className='info_section info_section_process'>
                            <div className='text_box'>
                                <EnterP delay={0.2} className='label'>Process</EnterP>
                                <EnterP delay={0.4} className='title'>채용보다 빠르게, <span>더 현명하게</span></EnterP>
                                <EnterP delay={0.6} className='comment'>반복되는 채용 절차를 줄이고, 실제 프로젝트에 집중하세요.<br />실무형 전문 개발자와의 즉시 협업으로 효율적인 업무 진행이 가능합니다.</EnterP>
                            </div>

                            <div className='content'>
                                <EnterP delay={0.6} className='title'>실무 작업 프로세스</EnterP>
                                <ul className='process_ul'>
                                    <Enterli>
                                        <div>
                                            <div className='flex' style={{}}>
                                                <div className='step'>
                                                    <p>STEP 1</p>
                                                </div>
                                                <img src={images.right4} alt={consts.imgAlt} />
                                            </div>
                                            <img src={images.process_1} alt={consts.imgAlt} />
                                            <div className='title_box'>
                                                <p className='title'>전문가 매칭</p>
                                                <p className='comment'>풍부한 프로젝트 경험을 보유한 개발팀을 귀사의 니즈에 맞춰 매칭합니다.</p>
                                            </div>
                                        </div>
                                    </Enterli>
                                    <Enterli delay={0.2}>
                                        <div>
                                            <div className='flex' style={{}}>
                                                <div className='step'>
                                                    <p>STEP 2</p>
                                                </div>
                                                <img src={images.right4} alt={consts.imgAlt} />
                                            </div>
                                            <img src={images.process_2} alt={consts.imgAlt} />
                                            <div className='title_box'>
                                                <p className='title'>팀 구성 완료</p>
                                                <p className='comment'>확실한 역량과 책임감을 가진 인재들로 팀을 구성, 바로 프로젝트에 착수합니다.</p>
                                            </div>
                                        </div>
                                        <p className='help'>
                                            구독 플랜에 따라 팀 구성 인원이 조정될 수 있습니다.
                                        </p>
                                    </Enterli>
                                    <Enterli delay={0.4}>
                                        <div>
                                            <div className='flex' style={{}}>
                                                <div className='step'>
                                                    <p>STEP 3</p>
                                                </div>
                                                <img src={images.right4} alt={consts.imgAlt} />
                                            </div>
                                            <img src={images.process_3} alt={consts.imgAlt} />
                                            <div className='title_box'>
                                                <p className='title'>프로젝트 수행</p>
                                                <p className='comment'>체계적 프로세스와 지속적인 커뮤니케이션으로 개발을 안정적으로 수행합니다.</p>
                                            </div>
                                        </div>
                                    </Enterli>
                                    <Enterli delay={0.6}>
                                        <div>
                                            <div className='flex' style={{}}>
                                                <div className='step'>
                                                    <p>STEP 4</p>
                                                </div>
                                            </div>
                                            <img src={images.process_4} alt={consts.imgAlt} />
                                            <div className='title_box'>
                                                <p className='title'>지속 테스트 및 유지보수</p>
                                                <p className='comment'>서비스 론칭 이후 정기적인 테스트와 유지보수로 안정적 서비스를 제공합니다.</p>
                                            </div>
                                        </div>
                                    </Enterli>
                                </ul>
                            </div>

                        </div>
                        <div ref={(el) => (sectionRefs.current[2] = el)} className='info_section info_section_price'>
                            <div className='text_box'>
                                <EnterP delay={0.2} className='label'>Price</EnterP>
                                <EnterP delay={0.4} className='title'>필요한 순간, <span>전문 개발팀</span>을 <br />구독으로 간편하게</EnterP>
                                <EnterP delay={0.6} className='comment'>필요한 인력과 전문성을 필요한 순간에만 구독으로 활용할 수 있어, <br />시간과 비용을 절약하면서도 프로젝트 완성도 및 퀄리티를 더욱 더 높일 수 있습니다.</EnterP>
                            </div>
                            <EnterDiv delay={0.5} amount={'some'} className='content'>
                                <p className='title'>구독 플랜</p>
                                <div className='gradient_box'>
                                    <div>
                                        <p className='title'>Lite</p>
                                        <p className='price'>300만원<span>VAT 별도</span></p>
                                        <button className='btn1' onClick={() => { navigate(routes.counseling) }} data-cursor-size="0px" >구독하기</button>
                                        <div className='messages'>
                                            <div className='message'>
                                                <img src={images.user} alt={consts.imgAlt} />
                                                <p>동시작업 개발자 1명</p>
                                            </div>
                                            <div className='message'>
                                                <img src={images.wrench} alt={consts.imgAlt} />
                                                <p>유지보수 및 마이너 개선</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className='title'>Plus</p>
                                        <p className='price'>500만원<span>VAT 별도</span></p>
                                        <button className='btn2' onClick={() => { navigate(routes.counseling) }} data-cursor-size="0px" >구독하기</button>
                                        <div className='messages'>
                                            <div className='message'>
                                                <img src={images.user} alt={consts.imgAlt} />
                                                <p>동시작업 개발자 1명</p>
                                            </div>
                                            <div className='message'>
                                                <img src={images.code} alt={consts.imgAlt} />
                                                <p>서비스 기능 신규 개발</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className='title'>Pro</p>
                                        <p className='price'>990만원<span>VAT 별도</span></p>
                                        <button className='btn1' onClick={() => { navigate(routes.counseling) }} data-cursor-size="0px" >구독하기</button>
                                        <div className='messages'>
                                            <div className='message'>
                                                <img src={images.users} alt={consts.imgAlt} />
                                                <p>동시작업 개발자 2명</p>
                                            </div>
                                            <div className='message'>
                                                <img src={images.sitemap} alt={consts.imgAlt} />
                                                <p>병렬 및 신규 기능 서비스 개발</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className='title'>Custom</p>
                                        <p className='price'>별도 문의</p>
                                        <button className='btn1' onClick={() => { navigate(routes.counseling) }} data-cursor-size="0px" >구독하기</button>
                                        <div className='messages'>
                                            <div className='message'>
                                                <img src={images.users} alt={consts.imgAlt} />
                                                <p>동시작업 개발자 조정 및 확장</p>
                                            </div>
                                            <div className='message'>
                                                <img src={images.server} alt={consts.imgAlt} />
                                                <p>규모 있는 시스템 개발 및 MVP 집중 개발</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </EnterDiv>
                        </div>
                        <div ref={(el) => (sectionRefs.current[3] = el)} className='info_section info_section_suggest'>
                            <div className='content'>
                                <EnterP delay={0.2} className='title'>이런 분들께 추천해요</EnterP>
                            </div>
                            <ul className='suggest_ul'>
                                <Enterli>
                                    <p className='title'>즉시 투입 가능한 전문 개발팀</p>
                                    <p className='comment'>채용 절차 없이도 검증된 시니어 개발자와 바로 협업할 수 있습니다.<br />프로젝트 일정에 맞춰 빠르게 투입되어, 즉시 개발을 시작할 수 있습니다.</p>
                                    <Image src={images.suggest_01} alt={consts.imgAlt} />
                                </Enterli>
                                <Enterli>
                                    <p className='title'>유연한 구독 구조로 비용 절감</p>
                                    <p className='comment'>단기 프로젝트부터 장기 운영까지, 상황에 맞게 개발 인력을 조정할 수 있습니다.<br />필요할 때만 구독해 효율적으로 예산을 관리하세요.</p>
                                    <Image src={images.suggest_02} alt={consts.imgAlt} />
                                </Enterli>
                                <Enterli>
                                    <p className='title'>투명한 협업과 안정적 유지보수</p>
                                    <p className='comment'>진행 상황을 실시간으로 공유하고, 프로젝트 종료 후에도 유지보수와 테스트를 지원합니다.<br />지속 가능한 코드와 관리 체계로 장기적인 개발 안정성을 확보합니다.</p>
                                    <Image src={images.suggest_03} alt={consts.imgAlt} />
                                </Enterli>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className='partners'>
                    <div className='title_box'>
                        <p className='label'>Partner</p>
                        <p className='title'>밍글의 신뢰를 함께 만든 <span>파트너들</span></p>
                        <p className='comment'>국내 외 다양한 기술 기업과의 긴밀한 협업으로 더 넓은 가능성과 글로벌 수준의 품질을 실현합니다.</p>
                    </div>

                    <div className='logos'>
                        <Marquee
                            speed={100}
                            style={{
                            }}
                            autoFill
                            pauseOnHover
                            gradient
                            gradientColor={'#282828'}
                            gradientWidth={90}
                        >
                            {partners1?.map((x, i) => {
                                return (
                                    <div className='logo' key={useId()} >
                                        <Image key={i} src={x} style={{ width: '100%', height: '100%' }} />
                                    </div>
                                )
                            })}
                        </Marquee>
                        <Marquee
                            speed={100}
                            direction='right'
                            style={{
                            }}
                            autoFill
                            pauseOnHover
                            gradient
                            gradientColor={'#282828'}
                            gradientWidth={90}
                        >
                            {partners2?.map((x, i) => {
                                return (
                                    <div className='logo' key={useId()} >
                                        <Image src={x} style={{ width: '100%', height: '100%' }} />
                                    </div>
                                )
                            })}
                        </Marquee>
                    </div>

                </div>


                <div className='partners portfolios'>
                    <div className='title_box'>
                        <p className='label'>Portfolio</p>
                        <p className='title'>우리가 만드는 것은 코드 그 이상입니다</p>
                        <p className='comment'>수많은 프로젝트 중 하나로 끝나는 개발이 아니라,<br />브랜드의 이야기를 담은 ‘완성된 경험’을 만들어갑니다.</p>

                        {/* <ToggleButtons
                                buttons={[
                                    { key: 'WEB', label: 'Web' },
                                    { key: 'MOBILE', label: 'Mobile' },
                                ]}
                                value={portpolioMode}
                                setValue={setPortpolioMode}
                            /> */}


                    </div>

                    <div className='thumbs'>
                        <div>
                            {portpolio1?.map((x, i) => {
                                return (
                                    <motion.div
                                        layoutId={`card-${x?.idx}`}
                                        className='item'
                                        key={x?.idx}
                                        onClick={() => setSelected(x)}
                                    >
                                        <video
                                            className=""
                                            src={consts.s3Url + x?.thumbVideo}
                                            playsInline
                                            muted
                                            autoPlay
                                            loop
                                        />
                                    </motion.div>
                                )
                            })}
                        </div>
                        <div>
                            {portpolio2?.map((x, i) => {
                                return (
                                    <motion.div
                                        layoutId={`card-${x?.idx}`}
                                        className='item'
                                        key={x?.idx}
                                        onClick={() => setSelected(x)}
                                    >
                                        <video
                                            className=""
                                            src={consts.s3Url + x?.thumbVideo}
                                            playsInline
                                            muted
                                            autoPlay
                                            loop
                                        />
                                    </motion.div>
                                )
                            })}
                        </div>
                        <div>
                            {portpolio3?.map((x, i) => {
                                return (
                                    <motion.div
                                        layoutId={`card-${x?.idx}`}
                                        className='item'
                                        key={x?.idx}
                                        onClick={() => setSelected(x)}
                                    >
                                        <video
                                            className=""
                                            src={consts.s3Url + x?.thumbVideo}
                                            playsInline
                                            muted
                                            autoPlay
                                            loop
                                        />
                                    </motion.div>
                                )
                            })}
                        </div>
                        {/* <Marquee
                                speed={100}
                                style={{
                                }}
                                autoFill
                                pauseOnHover
                                gradient
                                gradientColor={'#fff'}
                                gradientWidth={270}
                            >
                                {portpolio1?.map((x, i) => {
                                    return (
                                        <div className='item' key={useId()}>
                                            <img src={consts.s3Url + x?.mockup} style={{ width: '100%', height: '100%' }} />
                                        </div>
                                    )
                                })}
                            </Marquee>
                            <Marquee
                                speed={100}
                                direction='right'
                                style={{
                                }}
                                autoFill
                                pauseOnHover
                                gradient
                                gradientColor={'#fff'}
                                gradientWidth={270}
                            >
                                {portpolio2?.map((x, i) => {
                                    return (
                                        <div className='item' key={useId()}>
                                            <img src={consts.s3Url + x?.mockup} style={{ width: '100%', height: '100%' }} />
                                        </div>
                                    )
                                })}
                            </Marquee> */}
                    </div>


                    <div className='submit' onClick={() => {
                        window.open('https://mingle.company/portpolio')
                    }} data-cursor-size="0px" >
                        <p>포트폴리오 보기</p>
                        <img src={images.right} alt={consts.imgAlt} />
                    </div>

                </div>



            </div>


            <AnimatePresence>
                {selected && (
                    <>
                        {/* 백드롭 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelected(null)}
                            className='dim'
                        >
                            {/* 확대된 카드 */}
                            <motion.div
                                layoutId={`card-${selected?.idx}`}
                                className='pop_video'
                            >
                                <video
                                    className=""
                                    src={consts.s3Url + selected?.thumbVideo}
                                    playsInline
                                    muted
                                    autoPlay
                                    loop
                                />
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}