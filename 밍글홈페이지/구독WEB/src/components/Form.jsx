import { useRef, useState, useEffect } from 'react'
import { toast } from 'react-toastify';

import { useConfig, usePopup, usePopupComponent } from '@/store';

import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import { regPhone, regEmail, useDebouncedTimeout } from "@/libs/utils";

import API from "@/libs/api";

import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import InputFile from "@/components/InputFile";
import InputFileMultiple from "@/components/InputFileMultiple";
import InputSelect from "@/components/InputSelect";

import Term from "@/components/Term";

export default function Component() {

   
    const { configOptions } = useConfig();
    const { openPopup } = usePopup();
    const { open, openPopupComponent } = usePopupComponent();

    const setDebouncedTimeout = useDebouncedTimeout();

    const [company, setCompany] = useState("");
    const [name, setName] = useState("");
    const [hp, setHp] = useState("");
    const [email, setEmail] = useState("");
    const [site, setSite] = useState("");
    const [comment, setComment] = useState("");

    const [price, setPrice] = useState(null);

    const [services, setServices] = useState([]);
    const [projects, setProjects] = useState([]);

    const [files, setFiles] = useState([]);

    const [agree, setAgree] = useState(false);

    const [load, setLoad] = useState(false);
    
    const handleServices = (v) => {
        if (services?.includes(v)) setServices((prev) => prev?.filter(x => x !== v));
        else setServices((prev) => [...prev, v]);
    }
    const handleProjects = (v) => {
        if (projects?.includes(v)) setProjects((prev) => prev?.filter(x => x !== v));
        else setProjects((prev) => [...prev, v]);
    }

    const linkFunc = () => {
        openPopupComponent({
            component: <Term />
        })
    }

    const submitFunc = async () => {

        if(load) return;
        
        if(!company) {
            toast.error("회사명을 입력해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!name) {
            toast.error("담당자명을 입력해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!hp) {
            toast.error("연락처를 입력해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!email) {
            toast.error("이메일을 입력해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!regEmail.test(email)) {
            toast.error("이메일 형식이 아니에요.", consts.toastErrorOption);
            return;
        }
        if(services?.length < 1) {
            toast.error("진행할 서비스를 선택해 주세요.", consts.toastErrorOption);
            return;
        }
        if(projects?.length < 1) {
            toast.error("진행할 프로젝트를 선택해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!comment) {
            toast.error("진행할 프로젝트에 대해 설명해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!price) {
            toast.error("대략적인 프로젝트 예산을 선택해 주세요.", consts.toastErrorOption);
            return;
        }
        if(!agree) {
            toast.error("개인정보 수집이용에 동의해 주세요.", consts.toastErrorOption);
            return;
        }

        // 견적문의 등록 API
        setLoad(true);

        const id = toast.loading("Please wait...");

        let sender = {
            company,
            name,
            hp,
            email,
            site,
            services,
            projects,
            comment,
            price,
            files,
            agree
        }

        const { data, error } = await API.post('/v1/board/inquiry', sender, { id });

        setDebouncedTimeout(() => {

            setLoad(false);

            if(error) {
                return;
            }

            // toast.success();
            setCompany("");
            setName("");
            setHp("");
            setEmail("");
            setSite("");
            setComment("");
            setPrice(null);
            setServices([]);
            setProjects([]);
            setFiles([]);
            setAgree(false);

            toast.update(id, { render: 'Success!!', type: "success",  ...consts.toastOption});
            
            openPopup({
                message: '이른 시일 내에 확인 후 연락드리겠습니다.',
            })

        }, consts.apiDelayLong); 
    }

    return (
        <>
            <div className='form_one form_one_m'>
                <div className='submit' onClick={submitFunc}>
                    <p>Submit</p>
                    <img src={images.right} alt={consts.imgAlt}/>
                </div>
            </div>

            <div className='title_box'>
                <p>‘주식회사 밍글'과 함께 하실 <span className={company ? 'active' : ''}>{company || '회사명'}</span>의 <span className={name ? 'active' : ''}>{name || '담당자'}</span>님</p>
                <p>
                    <span className={services?.[0] ? 'active' : ''}>{services?.[0] || '서비스'}{services?.length > 1 ? <span>{services?.length})</span> : ""}</span>의
                    <span className={projects?.[0] ? 'active' : ''}> {projects?.[0] || '프로젝트'}{projects?.length > 1 ? <span>{projects?.length})</span> : ""}</span>에 대한 이야기를 들려주세요.
                </p>
            </div>

            <div className='form_list'>
                <div className='form_one'>
                    <div className='title_box'>
                        <p className='label required'>함께 소통할 여러분에 대해 소개해 주세요.</p>
                    </div>

                    <div className='input_list_box'>
                        <div className='input_list'>
                            <Input
                                name="company"
                                value={company}
                                setValue={setCompany}
                                label="회사명"
                                maxlength={10}
                            />
                            <Input
                                name="name"
                                value={name}
                                setValue={setName}
                                label="담당자명"
                                maxlength={10}
                            />
                        </div>
                        <div className='input_list'>
                            <Input
                                valid={'hp'}
                                name="hp"
                                value={hp}
                                setValue={setHp}
                                label="연락처"
                                maxlength={20}
                            />
                            <Input
                                name="email"
                                value={email}
                                setValue={setEmail}
                                label="이메일"
                                maxlength={30}
                            />
                        </div>
                    </div>
                </div>

                <div className='form_one'>
                    <div className='title_box'>
                        <p className='label required'>진행할 서비스에 대해 말씀해 주세요.</p>
                        <span>중복 선택 가능</span>
                    </div>

                    <div className='input_tags'>
                        {configOptions?.servicesOptions?.map((x, i) => {
                            return (
                                <p key={i} className={`${services?.includes(x) ? 'active' : ''}`} onClick={() => handleServices(x)}>{x}</p>
                            )
                        })}
                    </div>
                </div>

                <div className='form_one'>
                    <div className='title_box'>
                        <p className='label required'>진행할 프로젝트에 대해 말씀해 주세요.</p>
                        <span>중복 선택 가능</span>
                    </div>

                    <div className='input_tags'>
                        {configOptions?.projectsOptions?.map((x, i) => {
                            return (
                                <p key={i} className={`${projects?.includes(x) ? 'active' : ''}`} onClick={() => handleProjects(x)}>{x}</p>
                            )
                        })}
                    </div>
                </div>

                <div className='form_one'>
                    <div className='title_box'>
                        <p className='label'>기존 사이트 주소가 있으시다면 작성해 주세요.</p>
                    </div>

                    <div className='input_list_box'>
                        <div className='input_list'>
                            <Input
                                name="site"
                                value={site}
                                setValue={setSite}
                                placeholder={'ex) https://mingle.company'}
                            />
                        </div>
                    </div>
                </div>

                <div className='form_one'>
                    <div className='title_box'>
                        <p className='label required'>진행할 프로젝트에 대해 설명해 주세요.</p>
                    </div>

                    <div className='input_list_box'>
                        <div className='input_list'>
                            <TextArea
                                name="comment"
                                value={comment}
                                setValue={setComment}
                                placeholder={`ex)\n프로젝트 : 밍글 웹사이트 구축\n참고 레퍼런스 : https://mingle.company\n진행 목적 : 회사 소개 및 고객과 컨텍을 위한 웹사이트를 구축하길 희망합니다.\n문의 내용 : 참고 링크 및 프로젝트 관련 내용을 첨부하오니 확인 후 연락 부탁드리겠습니다.`}
                            />
                        </div>
                    </div>
                    <div className='input_list_box'>
                        <div className='input_list'>
                            <InputFileMultiple
                                filesValue={files}
                                setfilesValue={setFiles}
                            />
                        </div>
                    </div>
                </div>

                <div className='form_one'>
                    <div className='title_box'>
                        <p className='label required'>대략적인 프로젝트 예산에 대해 알려주세요.</p>
                    </div>

                    <div className='input_list_box'>
                        <div className='input_list' style={{ gap: 12 }}>
                            <InputSelect
                                name="price"
                                value={price}
                                setValue={setPrice}
                                optionNotKey={configOptions?.priceOptions}
                                placeholder={'프로젝트 예산'}
                            />
                            {/* <div className='input_tags'>
                                <p onClick={() => setPrice(null)}>미정</p>
                            </div> */}
                        </div>
                    </div>

                </div>

                <div className='form_one'>
                    <div className='term'>
                        <input type="checkbox" id="level1" name="required" className="checkbox2" onClick={() => setAgree(!agree)} checked={agree}/>
                        <label htmlFor="level1">개인정보 수집이용 동의(필수)</label>
                        <p onClick={linkFunc}>전문보기</p>
                    </div>
                </div>
                <div className='form_one form_one_pc'>
                    <div className='submit' onClick={submitFunc}>
                        <p>Submit</p>
                        <img src={images.right} alt={consts.imgAlt}/>
                    </div>
                </div>
            </div>
        </>
    )
}