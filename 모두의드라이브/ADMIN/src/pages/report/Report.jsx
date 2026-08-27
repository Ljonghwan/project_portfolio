import React, { useState, useEffect } from 'react';
import { Plus, X, Eye, Edit, Calendar, User, Download } from 'lucide-react';
import dayjs from 'dayjs';

const WeeklyReport = () => {
    // 미리보기/수정 모드 상태 관리
    const [isViewMode, setIsViewMode] = useState(false);

    /**
     * PDF 다운로드 기능
     * 브라우저의 인쇄 대화상자를 열어 PDF로 저장 가능
     */
    const handlePrint = () => {
        const printContent = document.getElementById('report_container').innerHTML;
        const printWindow = window.open();
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Print</title>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();

        return;
        const reportContainer = document.getElementById('report_container');
        reportContainer.style.overflow = 'visible';
        window.print();
        reportContainer.style.overflow = 'auto';
    };

    /**
     * textarea 자동 높이 조절
     * 입력된 내용에 맞춰 textarea의 높이를 동적으로 조정
     */
    const autoResizeTextarea = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    /**
     * 모드 전환 시 textarea 높이 재조정
     * 미리보기에서 수정 모드로 돌아올 때 모든 textarea의 높이를 다시 계산
     */
    useEffect(() => {
        if (!isViewMode) {
            setTimeout(() => {
                const textareas = document.querySelectorAll('textarea');
                textareas.forEach(textarea => {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                });
            }, 0);
        }
    }, [isViewMode]);

    /**
     * 초기 보고 기간 계산
     * 오늘 날짜 기준으로 해당 주의 월요일~금요일 날짜를 반환
     */
    const getInitialPeriod = () => {
        const today = dayjs();
        const dayOfWeek = today.day();
        const monday = today.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day');
        const friday = monday.add(4, 'day');
        return `${monday.format('YYYY년 M월 D일')} ~ ${friday.format('M월 D일')}`;
    };

    // 보고서 데이터 상태 관리
    const [reportData, setReportData] = useState({
        projectName: '',
        period: getInitialPeriod(),
        author: '',
        developments: [
            { category: '', content: '', progress: '', status: '완료' }
        ],
        issues: [
            { issue: '', description: '', solution: '', status: '해결' }
        ],
        nextWeek: [
            { priority: 'High', task: '', time: '', assignee: '' }
        ],
        notes: ''
    });

    /**
     * 테이블 항목 추가
     * 주요 개발 내용, 이슈, 다음주 계획에 새로운 행 추가
     */
    const addItem = (section) => {
        setReportData(prev => ({
            ...prev,
            [section]: [...prev[section],
            section === 'developments' ? { category: '', content: '', progress: '', status: '완료' } :
                section === 'issues' ? { issue: '', description: '', solution: '', status: '해결' } :
                    { priority: 'High', task: '', time: '', assignee: '' }
            ]
        }));
    };

    /**
     * 테이블 항목 삭제
     * 특정 섹션의 특정 인덱스 항목을 삭제
     */
    const removeItem = (section, index) => {
        setReportData(prev => ({
            ...prev,
            [section]: prev[section].filter((_, i) => i !== index)
        }));
    };

    /**
     * 테이블 항목 수정
     * 특정 섹션의 특정 인덱스 항목의 필드 값을 업데이트
     */
    const updateItem = (section, index, field, value) => {
        setReportData(prev => ({
            ...prev,
            [section]: prev[section].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    /**
     * 기본 필드 업데이트
     * 프로젝트명, 작성자, 특이사항 등 단일 필드 값 업데이트
     */
    const updateField = (field, value) => {
        setReportData(prev => ({ ...prev, [field]: value }));
    };

    /**
     * 주간 날짜 변경 처리
     * 선택한 날짜를 기준으로 해당 주의 월요일~금요일 계산 및 업데이트
     */
    const handleWeekChange = (dateString) => {
        if (!dateString) {
            updateField('period', '');
            return;
        }
        const selectedDate = dayjs(dateString);
        const dayOfWeek = selectedDate.day();
        const monday = selectedDate.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day');
        const friday = monday.add(4, 'day');

        const periodString = `${monday.format('YYYY년 M월 D일')} ~ ${friday.format('M월 D일')}`;
        updateField('period', periodString);
    };

    /**
     * 데모 데이터 불러오기
     * 테스트용 샘플 데이터를 보고서에 채워넣음
     */
    const loadDemoData = () => {
        setReportData({
            projectName: '사소한소개팅 리뉴얼',
            period: '2024년 12월 16일 ~ 12월 22일',
            author: '주인',
            developments: [
                { category: '백엔드', content: '리뉴얼 요구사항 분석 및 설계 완료', progress: '100', status: '완료' },
                { category: '백엔드', content: 'API 엔드포인트 목록 정리 (픽켓/컨텐츠/정산)', progress: '90', status: '진행중' },
                { category: '백엔드', content: '데이터베이스 스키마 수정안 작성 (픽켓/사계로그/만남인증)', progress: '85', status: '진행중' },
                { category: '프론트엔드', content: 'Expo SDK 버전 업데이트 및 라이브러리 호환성 검토', progress: '100', status: '완료' },
                { category: '프론트엔드', content: 'UI/UX 변경사항 정리 및 계절별 테마 디자인 시스템 구축', progress: '80', status: '진행중' },
                { category: '프론트엔드', content: '화면 구조 및 네비게이션 재설계 (블라썸/여름의밤/N호커플)', progress: '75', status: '진행중' },
                { category: '공통', content: '관리자 페이지 기능 요구사항 정리', progress: '90', status: '진행중' }
            ],
            issues: [
                { issue: 'Expo 버전 업데이트', description: '최신 Expo SDK 업데이트 시 기존 라이브러리 충돌 우려', solution: '단계별 마이그레이션 계획 수립, 필수 라이브러리부터 호환성 테스트 진행', status: '진행중' },
                { issue: '픽켓 이펙트 파일 포맷', description: 'gif/webp/json 중 성능과 품질 고려 필요', solution: 'Lottie(json) 방식 우선 검토, 용량 및 애니메이션 성능 테스트 예정', status: '검토중' },
                { issue: '실시간 스케줄러 구현', description: '일차별 정확한 시간(18시, 20시)에 이벤트 발생 필요', solution: 'Node.js Cron 또는 Bull Queue 활용 검토, 서버 시간 동기화 방안 수립', status: '대기' },
                { issue: '데이터 마이그레이션', description: '기존 사용자 데이터를 새로운 스키마로 전환 필요', solution: '마이그레이션 스크립트 작성 및 스테이징 환경 테스트 계획 수립', status: '대기' }
            ],
            nextWeek: [
                { priority: 'High', task: 'Expo SDK 업데이트 및 라이브러리 호환성 테스트', time: '2일', assignee: '프론트엔드팀' },
                { priority: 'High', task: '픽켓 시스템 데이터베이스 스키마 확정 및 마이그레이션 스크립트 작성', time: '2일', assignee: '백엔드팀' },
                { priority: 'High', task: '계절별 테마 디자인 시스템 구축 및 컴포넌트 설계', time: '2일', assignee: '프론트엔드팀' },
                { priority: 'Medium', task: '블라썸/여름의 밤 컨텐츠 API 개발 착수', time: '3일', assignee: '백엔드팀' },
                { priority: 'Medium', task: '관리자 페이지 만남 인증 확인 기능 UI 개발', time: '2일', assignee: '프론트엔드팀' },
                { priority: 'Low', task: 'N호 커플 시스템 상세 기획 검토 회의', time: '1일', assignee: '전체' }
            ],
            notes: '기존 앱 리뉴얼 프로젝트로 기존 사용자 데이터 보존 및 마이그레이션이 중요함\nExpo 버전 업데이트를 통해 오래된 라이브러리 의존성 문제 해결 예정\n계절별 이펙트 애니메이션 파일 포맷 확정 후 디자이너와 협업 필요\n실시간 이벤트 발생이 중요한 기능이므로 테스트 환경 구축 우선 필요\n슈퍼 픽켓 환불/정산 로직이 복잡하므로 QA 시나리오 상세 작성 필요'
        });
    };

    /**
     * 데이터 초기화
     * 사용자 확인 후 모든 보고서 데이터를 초기 상태로 되돌림
     */
    const resetData = () => {
        if (window.confirm('모든 데이터를 초기화하시겠습니까?')) {
            setReportData({
                projectName: '',
                period: getInitialPeriod(),
                author: '',
                developments: [
                    { category: '', content: '', progress: '', status: '완료' }
                ],
                issues: [
                    { issue: '', description: '', solution: '', status: '해결' }
                ],
                nextWeek: [
                    { priority: 'High', task: '', time: '', assignee: '' }
                ],
                notes: ''
            });
        }
    };

    return (
        <>

            <div id="report_container" className='box' style={{ overflow: 'auto', height: '100%' }}>
                <style>{`
                    textarea {
                        height: 100%;
                    }
                    .input_header::placeholder {
                        font-size: 24px !important;
                    }
                    @media print {
                        .no-print {
                            display: none !important;
                        }
                        .print-container {
                            box-shadow: none !important;
                            border-radius: 0 !important;
                        }
                        body {
                            background: white !important;
                        }
                    }
                `}</style>
                
                <div style={{
                    // minHeight: '100vh',
                    width: '100%',
                    background: '#f8f9fa',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif'
                }}>
                    <div className="print-container" style={{
                        // maxWidth: '1400px',
                        margin: '0 auto',
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        // overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            background: '#ffffff',
                            borderBottom: '1px solid #e9ecef',
                            padding: '32px 40px',
                            position: 'relative'
                        }}>
                            <h1 style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                margin: 0,
                                color: '#212529',
                                letterSpacing: '-0.5px'
                            }}>
                                {isViewMode ? (
                                    reportData.projectName ? `[${reportData.projectName}] 주간 개발 보고서` : '주간 개발 보고서'
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>[</span>
                                        <input
                                            className='input_header'
                                            type="text"
                                            value={reportData.projectName}
                                            onChange={(e) => updateField('projectName', e.target.value)}
                                            placeholder="프로젝트명"
                                            style={{
                                                borderRadius: 0,
                                                border: 'none',
                                                borderBottom: '2px solid #0d6efd',
                                                outline: 'none',
                                                fontSize: '24px',
                                                fontWeight: '700',
                                                padding: '0 8px',
                                                width: '250px',
                                                background: 'transparent'
                                            }}
                                        />
                                        <span>] 주간 개발 보고서</span>
                                    </div>
                                )}
                            </h1>

                            <div className="no-print" style={{
                                position: 'absolute',
                                top: '32px',
                                right: '40px',
                                display: 'flex',
                                gap: '8px',
                                zIndex: 2
                            }}>
                                {isViewMode && (
                                    <button
                                        onClick={handlePrint}
                                        style={{
                                            background: '#198754',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 16px',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={e => e.target.style.background = '#157347'}
                                        onMouseLeave={e => e.target.style.background = '#198754'}
                                    >
                                        <Download size={16} /> PDF 다운로드
                                    </button>
                                )}
                                {!isViewMode && (
                                    <>
                                        <button
                                            onClick={loadDemoData}
                                            style={{
                                                background: '#f8f9fa',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '6px',
                                                padding: '8px 16px',
                                                color: '#495057',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={e => {
                                                e.target.style.background = '#e9ecef';
                                                e.target.style.borderColor = '#adb5bd';
                                            }}
                                            onMouseLeave={e => {
                                                e.target.style.background = '#f8f9fa';
                                                e.target.style.borderColor = '#dee2e6';
                                            }}
                                        >
                                            데모 데이터
                                        </button>
                                        <button
                                            onClick={resetData}
                                            style={{
                                                background: '#f8f9fa',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '6px',
                                                padding: '8px 16px',
                                                color: '#495057',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={e => {
                                                e.target.style.background = '#e9ecef';
                                                e.target.style.borderColor = '#adb5bd';
                                            }}
                                            onMouseLeave={e => {
                                                e.target.style.background = '#f8f9fa';
                                                e.target.style.borderColor = '#dee2e6';
                                            }}
                                        >
                                            초기화
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setIsViewMode(!isViewMode)}
                                    style={{
                                        background: isViewMode ? '#f8f9fa' : '#0d6efd',
                                        border: isViewMode ? '1px solid #dee2e6' : 'none',
                                        borderRadius: '6px',
                                        padding: '8px 16px',
                                        color: isViewMode ? '#495057' : 'white',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={e => {
                                        if (isViewMode) {
                                            e.target.style.background = '#e9ecef';
                                            e.target.style.borderColor = '#adb5bd';
                                        } else {
                                            e.target.style.background = '#0b5ed7';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (isViewMode) {
                                            e.target.style.background = '#f8f9fa';
                                            e.target.style.borderColor = '#dee2e6';
                                        } else {
                                            e.target.style.background = '#0d6efd';
                                        }
                                    }}
                                >
                                    {isViewMode ? <><Edit size={16} /> 수정</> : <><Eye size={16} /> 미리보기</>}
                                </button>
                            </div>
                        </div>

                        <div className="print-content" style={{ padding: '40px' }}>
                            {/* Basic Info */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px',
                                marginBottom: '32px',
                                padding: '20px',
                                background: '#f8f9fa',
                                borderRadius: '6px',
                                border: '1px solid #e9ecef'
                            }}>
                                <div>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: '#495057',
                                        marginBottom: '8px'
                                    }}>
                                        <Calendar size={16} />
                                        보고 기간
                                    </label>
                                    {isViewMode ? (
                                        <div style={{ fontSize: '15px', color: '#212529' }}>
                                            {reportData.period || '-'}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                type="date"
                                                onChange={(e) => handleWeekChange(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '4px',
                                                    fontSize: '14px',
                                                    transition: 'border-color 0.15s, box-shadow 0.15s',
                                                    cursor: 'pointer'
                                                }}
                                                onFocus={e => {
                                                    e.target.style.borderColor = '#86b7fe';
                                                    e.target.style.boxShadow = '0 0 0 0.25rem rgba(13,110,253,.25)';
                                                }}
                                                onBlur={e => {
                                                    e.target.style.borderColor = '#ced4da';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                            {reportData.period && (
                                                <div style={{
                                                    marginTop: '8px',
                                                    fontSize: '13px',
                                                    color: '#0d6efd',
                                                    fontWeight: '500'
                                                }}>
                                                    {reportData.period}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: '#495057',
                                        marginBottom: '8px'
                                    }}>
                                        <User size={16} />
                                        작성자
                                    </label>
                                    {isViewMode ? (
                                        <div style={{ fontSize: '15px', color: '#212529' }}>
                                            {reportData.author || '-'}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={reportData.author}
                                            onChange={(e) => updateField('author', e.target.value)}
                                            placeholder="이름을 입력하세요"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                transition: 'border-color 0.15s, box-shadow 0.15s',
                                                height: 'auto'
                                            }}
                                            onFocus={e => {
                                                e.target.style.borderColor = '#86b7fe';
                                                e.target.style.boxShadow = '0 0 0 0.25rem rgba(13,110,253,.25)';
                                            }}
                                            onBlur={e => {
                                                e.target.style.borderColor = '#ced4da';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Section 1: 주요 개발 내용 */}
                            <Section title="1. 주요 개발 내용">
                                <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={tableHeaderStyle}>구분</th>
                                                <th style={tableHeaderStyle}>개발 내용</th>
                                                <th style={tableHeaderStyle}>진행률(%)</th>
                                                <th style={tableHeaderStyle}>상태</th>
                                                {!isViewMode && <th style={{ ...tableHeaderStyle, width: '60px', borderRight: 'none' }}></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.developments.map((dev, idx) => (
                                                <tr key={idx} style={{
                                                    background: 'white',
                                                    transition: 'background 0.15s'
                                                }}>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? (
                                                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontWeight: '600' }}>{dev.category}</div>
                                                        ) : (
                                                            <textarea
                                                                value={dev.category}
                                                                onChange={(e) => {
                                                                    updateItem('developments', idx, 'category', e.target.value);
                                                                    autoResizeTextarea(e);
                                                                }}
                                                                onInput={autoResizeTextarea}
                                                                placeholder="예: 백엔드"
                                                                style={inputStyle}
                                                                rows={1}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? (
                                                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{dev.content}</div>
                                                        ) : (
                                                            <textarea
                                                                value={dev.content}
                                                                onChange={(e) => {
                                                                    updateItem('developments', idx, 'content', e.target.value);
                                                                    autoResizeTextarea(e);
                                                                }}
                                                                onInput={autoResizeTextarea}
                                                                placeholder="개발 내용을 입력하세요"
                                                                style={inputStyle}
                                                                rows={1}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? dev.progress : (
                                                            <input
                                                                type="text"
                                                                value={dev.progress}
                                                                onChange={(e) => updateItem('developments', idx, 'progress', e.target.value)}
                                                                placeholder="80"
                                                                style={inputStyle}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? (
                                                            <span style={getStatusBadge(dev.status)}>{dev.status}</span>
                                                        ) : (
                                                            <select
                                                                value={dev.status}
                                                                onChange={(e) => updateItem('developments', idx, 'status', e.target.value)}
                                                                style={{
                                                                    ...inputStyle,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <option value="완료">완료</option>
                                                                <option value="진행중">진행중</option>
                                                                <option value="대기">대기</option>
                                                                <option value="검토중">검토중</option>
                                                            </select>
                                                        )}
                                                    </td>
                                                    {!isViewMode && (
                                                        <td style={tableCellStyle}>
                                                            <button
                                                                onClick={() => removeItem('developments', idx)}
                                                                style={deleteButtonStyle}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {!isViewMode && (
                                    <button onClick={() => addItem('developments')} style={addButtonStyle}>
                                        <Plus size={20} /> 항목 추가
                                    </button>
                                )}
                            </Section>

                            {/* Section 2: 주요 이슈 및 해결 방안 */}
                            <Section title="2. 주요 이슈 및 해결 방안">
                                <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={tableHeaderStyle}>이슈</th>
                                                <th style={tableHeaderStyle}>내용</th>
                                                <th style={tableHeaderStyle}>해결 방안</th>
                                                <th style={tableHeaderStyle}>상태</th>
                                                {!isViewMode && <th style={{ ...tableHeaderStyle, width: '60px', borderRight: 'none' }}></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.issues.map((issue, idx) => (
                                                <tr key={idx} style={{
                                                    background: 'white',
                                                    transition: 'background 0.15s'
                                                }}>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? (
                                                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontWeight: '600' }}>{issue.issue}</div>
                                                        ) : (
                                                            <textarea
                                                                value={issue.issue}
                                                                onChange={(e) => {
                                                                    updateItem('issues', idx, 'issue', e.target.value);
                                                                    autoResizeTextarea(e);
                                                                }}
                                                                onInput={autoResizeTextarea}
                                                                placeholder="이슈명"
                                                                style={inputStyle}
                                                                rows={1}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? (
                                                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{issue.description}</div>
                                                        ) : (
                                                            <textarea
                                                                value={issue.description}
                                                                onChange={(e) => {
                                                                    updateItem('issues', idx, 'description', e.target.value);
                                                                    autoResizeTextarea(e);
                                                                }}
                                                                onInput={autoResizeTextarea}
                                                                placeholder="이슈 내용"
                                                                style={inputStyle}
                                                                rows={1}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? (
                                                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{issue.solution}</div>
                                                        ) : (
                                                            <textarea
                                                                value={issue.solution}
                                                                onChange={(e) => {
                                                                    updateItem('issues', idx, 'solution', e.target.value);
                                                                    autoResizeTextarea(e);
                                                                }}
                                                                onInput={autoResizeTextarea}
                                                                placeholder="해결 방안"
                                                                style={inputStyle}
                                                                rows={1}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? (
                                                            <span style={getStatusBadge(issue.status)}>{issue.status}</span>
                                                        ) : (
                                                            <select
                                                                value={issue.status}
                                                                onChange={(e) => updateItem('issues', idx, 'status', e.target.value)}
                                                                style={{
                                                                    ...inputStyle,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <option value="해결">해결</option>
                                                                <option value="진행중">진행중</option>
                                                            </select>
                                                        )}
                                                    </td>
                                                    {!isViewMode && (
                                                        <td style={tableCellStyle}>
                                                            <button
                                                                onClick={() => removeItem('issues', idx)}
                                                                style={deleteButtonStyle}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {!isViewMode && (
                                    <button onClick={() => addItem('issues')} style={addButtonStyle}>
                                        <Plus size={20} /> 항목 추가
                                    </button>
                                )}
                            </Section>

                            {/* Section 3: 다음 주 계획 */}
                            <Section title="3. 다음 주 계획">
                                <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={tableHeaderStyle}>우선순위</th>
                                                <th style={tableHeaderStyle}>작업 내용</th>
                                                <th style={tableHeaderStyle}>예상 소요 시간</th>
                                                <th style={tableHeaderStyle}>담당자</th>
                                                {!isViewMode && <th style={{ ...tableHeaderStyle, width: '60px', borderRight: 'none' }}></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.nextWeek.map((plan, idx) => (
                                                <tr key={idx} style={{
                                                    background: 'white',
                                                    transition: 'background 0.15s'
                                                }}>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? (
                                                            <span style={getPriorityBadge(plan.priority)}>{plan.priority}</span>
                                                        ) : (
                                                            <select
                                                                value={plan.priority}
                                                                onChange={(e) => updateItem('nextWeek', idx, 'priority', e.target.value)}
                                                                style={{
                                                                    ...inputStyle,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <option value="High">High</option>
                                                                <option value="Medium">Medium</option>
                                                                <option value="Low">Low</option>
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? (
                                                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{plan.task}</div>
                                                        ) : (
                                                            <textarea
                                                                value={plan.task}
                                                                onChange={(e) => {
                                                                    updateItem('nextWeek', idx, 'task', e.target.value);
                                                                    autoResizeTextarea(e);
                                                                }}
                                                                onInput={autoResizeTextarea}
                                                                placeholder="작업 내용"
                                                                style={inputStyle}
                                                                rows={1}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? (
                                                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{plan.time}</div>
                                                        ) : (
                                                            <textarea
                                                                value={plan.time}
                                                                onChange={(e) => {
                                                                    updateItem('nextWeek', idx, 'time', e.target.value);
                                                                    autoResizeTextarea(e);
                                                                }}
                                                                onInput={autoResizeTextarea}
                                                                placeholder="3일"
                                                                style={inputStyle}
                                                                rows={1}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        {isViewMode ? (
                                                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{plan.assignee}</div>
                                                        ) : (
                                                            <textarea
                                                                value={plan.assignee}
                                                                onChange={(e) => {
                                                                    updateItem('nextWeek', idx, 'assignee', e.target.value);
                                                                    autoResizeTextarea(e);
                                                                }}
                                                                onInput={autoResizeTextarea}
                                                                placeholder="담당자명"
                                                                style={inputStyle}
                                                                rows={1}
                                                            />
                                                        )}
                                                    </td>
                                                    {!isViewMode && (
                                                        <td style={tableCellStyle}>
                                                            <button
                                                                onClick={() => removeItem('nextWeek', idx)}
                                                                style={deleteButtonStyle}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {!isViewMode && (
                                    <button onClick={() => addItem('nextWeek')} style={addButtonStyle}>
                                        <Plus size={20} /> 항목 추가
                                    </button>
                                )}
                            </Section>

                            {/* Section 4: 특이사항 */}
                            <Section title="4. 특이사항 및 비고">
                                {isViewMode ? (
                                    <div style={{
                                        padding: '16px',
                                        background: '#f8f9fa',
                                        borderRadius: '4px',
                                        minHeight: '100px',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        color: '#212529',
                                        whiteSpace: 'pre-wrap',
                                        border: '1px solid #e9ecef'
                                    }}>
                                        {reportData.notes || '특이사항이 없습니다.'}
                                    </div>
                                ) : (
                                    <textarea
                                        value={reportData.notes}
                                        onChange={(e) => updateField('notes', e.target.value)}
                                        placeholder="특이사항을 입력하세요..."
                                        style={{
                                            width: '100%',
                                            minHeight: '100px',
                                            padding: '12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            resize: 'vertical',
                                            transition: 'border-color 0.15s, box-shadow 0.15s'
                                        }}
                                        onFocus={e => {
                                            e.target.style.borderColor = '#86b7fe';
                                            e.target.style.boxShadow = '0 0 0 0.25rem rgba(13,110,253,.25)';
                                        }}
                                        onBlur={e => {
                                            e.target.style.borderColor = '#ced4da';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                )}
                            </Section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

/**
 * 섹션 컴포넌트
 * 보고서의 각 섹션(주요 개발 내용, 이슈, 다음주 계획 등)을 감싸는 래퍼
 */
const Section = ({ title, children }) => (
    <div style={{ marginBottom: '32px' }}>
        <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#212529',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '2px solid #dee2e6'
        }}>
            {title}
        </h2>
        {children}
    </div>
);

// 테이블 헤더 스타일
const tableHeaderStyle = {
    padding: '12px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '600',
    color: '#495057',
    background: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    borderRight: '1px solid #dee2e6'
};

// 테이블 셀 스타일
const tableCellStyle = {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px',
    color: '#212529',
    verticalAlign: 'middle'
};

// 입력 필드(textarea) 스타일
const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '13px',
    // background: 'white',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    resize: 'none',
    minHeight: '32px',
    lineHeight: '1.4',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
    overflow: 'hidden'
};

// 항목 추가 버튼 스타일
const addButtonStyle = {
    marginTop: '12px',
    padding: '8px 16px',
    background: '#0d6efd',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background 0.2s'
};

// 삭제 버튼 스타일
const deleteButtonStyle = {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
};

/**
 * 상태 배지 스타일 반환
 * 완료, 진행중, 대기, 검토중, 해결 상태에 따라 다른 색상의 배지 스타일 제공
 */
const getStatusBadge = (status) => {
    const colors = {
        '완료': { bg: '#d1e7dd', color: '#0f5132', border: '#a3cfbb' },
        '진행중': { bg: '#cfe2ff', color: '#084298', border: '#9ec5fe' },
        '대기': { bg: '#fff3cd', color: '#997404', border: '#ffe69c' },
        '검토중': { bg: '#e7d6f5', color: '#432874', border: '#d0b8e8' },
        '해결': { bg: '#d1e7dd', color: '#0f5132', border: '#a3cfbb' }
    };
    const style = colors[status] || { bg: '#e9ecef', color: '#495057', border: '#dee2e6' };

    return {
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`
    };
};

/**
 * 우선순위 배지 스타일 반환
 * High, Medium, Low 우선순위에 따라 다른 색상의 배지 스타일 제공
 */
const getPriorityBadge = (priority) => {
    const colors = {
        'High': { bg: '#f8d7da', color: '#842029', border: '#f1aeb5' },
        'Medium': { bg: '#fff3cd', color: '#997404', border: '#ffe69c' },
        'Low': { bg: '#d1e7dd', color: '#0f5132', border: '#a3cfbb' }
    };
    const style = colors[priority] || { bg: '#e9ecef', color: '#495057', border: '#dee2e6' };

    return {
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`
    };
};

export default WeeklyReport;


