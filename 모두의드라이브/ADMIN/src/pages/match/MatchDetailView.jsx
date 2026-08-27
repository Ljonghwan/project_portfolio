import { useState, useEffect, useRef } from 'react'
import { Card, Button, Space, Tag, Typography, App as AntApp, Descriptions, Image, Avatar } from 'antd'
import { UserOutlined, DeleteOutlined, EyeOutlined, SmileOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import API from "@/libs/api"
import { STORAGE_URL } from '@/libs/consts'
import { useConfigLabelMap, useConfigColorMap } from '@/store'

const { Title, Text, Paragraph } = Typography

const getDday = (driveDate) => {
    if (!driveDate) return null
    const diff = dayjs(driveDate).diff(dayjs().startOf('day'), 'day')
    if (diff === 0) return 'D-day'
    if (diff > 0) return `D-${diff}`
    return `D+${Math.abs(diff)}`
}

const stripDriveLevelSuffix = (label) => (label || '').replace(/\s*\(.*\)$/, '')

const parseImageUrls = (content) => {
    if (!content) return []
    if (typeof content === 'string' && content.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(content)
            return Array.isArray(arr) ? arr.filter(Boolean) : [content]
        } catch {
            return [content]
        }
    }
    return [content]
}

export default function MatchDetailView({ data: initialData, onBack, onRefresh }) {
    const { message, modal } = AntApp.useApp()
    const [data, setData] = useState(initialData)

    const roleLabelMap = useConfigLabelMap('roles')
    const matchTypeLabelMap = useConfigLabelMap('matchTypes')
    const matchStatusLabelMap = useConfigLabelMap('matchStatuses')
    const matchStatusColorMap = useConfigColorMap('matchStatuses')
    const participantStatusLabelMap = useConfigLabelMap('participantStatuses')
    const participantStatusColorMap = useConfigColorMap('participantStatuses')
    const genderLabelMap = useConfigLabelMap('genders')
    const carTypeLabelMap = useConfigLabelMap('carTypes')
    const driveTypeLabelMap = useConfigLabelMap('driveTypes')
    const driveLevelLabelMap = useConfigLabelMap('driveLevels')

    const chatScrollRef = useRef(null)

    useEffect(() => {
        setData(initialData)
    }, [initialData])

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
        }
    }, [data?.chatMessages])

    const idx = data?.idx

    const refreshData = async () => {
        const { data: result } = await API.post('/admin/match/detail', { idx })
        setData(result)
    }

    const handleDelete = () => {
        modal.confirm({
            title: '삭제 확인',
            content: '이 게시글을 삭제하시겠습니까?',
            okText: '삭제',
            cancelText: '취소',
            okType: 'danger',
            onOk: async () => {
                await API.post('/admin/match/delete', { idx })
                message.success('삭제되었습니다.')
                onBack()
            },
        })
    }

    const handleDeletePhoto = async (photoIdx) => {
        modal.confirm({
            title: '사진 삭제',
            content: '이 사진을 삭제하시겠습니까?',
            okText: '삭제',
            cancelText: '취소',
            okType: 'danger',
            onOk: async () => {
                await API.post('/admin/match/deletePhoto', { idx, photoIdx })
                message.success('사진이 삭제되었습니다.')
                refreshData()
            },
        })
    }

    if (!data) return <Text>데이터가 없습니다.</Text>

    const allParticipants = data.participants || []
    const acceptedParticipants = allParticipants.filter((p) => p.status === 'accepted')
    const authorEntry = {
        userIdx: data.authorIdx,
        nickname: data.authorNickname,
        profileImage: data.authorProfileImage,
        age: data.authorAge,
        gender: data.authorGender,
        status: 'accepted',
        noShow: false,
        isAuthor: true,
    }
    const confirmedList = data.authorIdx ? [authorEntry, ...acceptedParticipants] : acceptedParticipants
    const applicantList = allParticipants.filter((p) => p.status !== 'accepted')

    const dday = getDday(data.driveDate)
    const isOwnerAuthor = data.authorRole === 'owner'
    const driveTypeList = Array.isArray(data.driveTypes) ? data.driveTypes : []
    const ownerGenderArr = Array.isArray(data.ownerGender) ? data.ownerGender : []
    const ownerAgeArr = Array.isArray(data.ownerAge) ? data.ownerAge : []
    const guestGenderArr = Array.isArray(data.guestGender) ? data.guestGender : []
    const guestAgeArr = Array.isArray(data.guestAge) ? data.guestAge : []

    const formatGenderAge = (genders, ages) => {
        const g = (genders || []).filter((x) => x !== 'any')
        const a = (ages || []).filter((x) => x !== 'any').sort((x, y) => parseInt(x) - parseInt(y))
        let gText
        if (g.length === 0 || g.length >= 2) gText = '남녀 무관'
        else if (g[0] === 'M') gText = '남성'
        else gText = '여성'
        const aText = a.length > 0 ? a.map((v) => `${v}대`).join(',') : '전 연령'
        return `${gText}, ${aText}`
    }
    const ownerCondText = formatGenderAge(ownerGenderArr, ownerAgeArr)
    const guestCondText = formatGenderAge(guestGenderArr, guestAgeArr)

    return (
        <>
            <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
                <Space>
                    <Button onClick={onBack}>← 목록</Button>
                    <Title level={4} style={{ margin: 0 }}>게시글 상세보기</Title>
                    {data.status && (
                        <Tag color={matchStatusColorMap[data.status] || 'default'}>
                            {matchStatusLabelMap[data.status] || data.status}
                        </Tag>
                    )}
                    {dday && <Tag color="blue">{dday}</Tag>}
                </Space>
                <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>삭제하기</Button>
            </Space>

            {/* 작성자 카드 */}
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <Avatar
                        size={64}
                        src={data.authorProfileImage ? `${STORAGE_URL}${data.authorProfileImage}` : undefined}
                        icon={<UserOutlined />}
                    />
                    <div style={{ flex: 1 }}>
                        <Space wrap>
                            <Text strong style={{ fontSize: 16 }}>{data.authorNickname || '-'}</Text>
                            <Tag color={isOwnerAuthor ? 'gold' : 'green'}>
                                {isOwnerAuthor ? '오너' : '게스트'}
                            </Tag>
                            {data.authorAge != null && <Tag>{data.authorAge}세</Tag>}
                            {data.authorGender && <Tag>{genderLabelMap[data.authorGender] || data.authorGender}</Tag>}
                            {isOwnerAuthor && data.authorDriveLevel && (
                                <Tag color="blue">
                                    {stripDriveLevelSuffix(driveLevelLabelMap[data.authorDriveLevel]) || data.authorDriveLevel}
                                </Tag>
                            )}
                        </Space>
                        <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                            <Text type="secondary">{data.authorEmail || '-'}</Text>
                        </div>
                        {isOwnerAuthor && Array.isArray(data.authorCars) && data.authorCars.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <Text type="secondary" style={{ marginRight: 8 }}>소유 차종</Text>
                                <Space wrap>
                                    {data.authorCars.map((car, i) => (
                                        <Tag key={i}>
                                            {(carTypeLabelMap[car.carType] || car.carType)}{car.carModel ? ` · ${car.carModel}` : ''}
                                        </Tag>
                                    ))}
                                </Space>
                            </div>
                        )}
                        <Space wrap style={{ marginTop: 12 }} size={16}>
                            <Text>
                                <SmileOutlined style={{ marginRight: 4, color: '#faad14' }} />
                                매너 <Text strong>{data.authorMannerScore != null ? Math.round(Number(data.authorMannerScore)) : '-'}</Text>
                            </Text>
                            <Text>매칭 <Text strong>{data.authorMatchCount ?? 0}</Text></Text>
                            <Text>리뷰 <Text strong>{data.authorReviewCount ?? 0}</Text></Text>
                            <Text type="danger">노쇼 <Text strong>{data.authorNoshowCount ?? 0}</Text>건</Text>
                            <Text type="danger">신고 <Text strong>{data.authorReportCount ?? 0}</Text>건</Text>
                        </Space>
                    </div>
                </div>
            </Card>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* 등록정보 */}
                <Card title="등록정보" style={{ width: 500 }}>
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="NO" styles={{ label: { width: 150 } }}>{String(data.idx).padStart(10, '0') || '-'}</Descriptions.Item>
                        <Descriptions.Item label="등록일시">
                            {data.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm') : ''}
                        </Descriptions.Item>
                        <Descriptions.Item label="회원유형">
                            <Tag>{roleLabelMap[data.authorRole] || data.authorRole}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="매칭구분">{matchTypeLabelMap[data.matchType] || data.matchType}</Descriptions.Item>
                        <Descriptions.Item label="아이디">{data.authorEmail || '-'}</Descriptions.Item>
                        <Descriptions.Item label="닉네임">{data.authorNickname || '-'}</Descriptions.Item>
                        <Descriptions.Item label="만나는곳">{data.meetingRegion || '-'}</Descriptions.Item>
                        <Descriptions.Item label="목적지">{data.destination || '-'}</Descriptions.Item>
                        <Descriptions.Item label="날짜">{data.driveDate ? dayjs(data.driveDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
                        <Descriptions.Item label="시작~종료">{data.driveTime || '-'}</Descriptions.Item>
                        <Descriptions.Item label="조회수">
                            <Space>
                                <EyeOutlined />
                                <span>{(data.viewCount || 0).toLocaleString()}</span>
                            </Space>
                        </Descriptions.Item>
                        {data.matchType === 'group' ? (
                            <>
                                <Descriptions.Item label="오너조건">
                                    {ownerCondText}{(data.ownerMaxCount || 0) > 0 ? `, 총 ${data.ownerMaxCount}명` : ''}
                                </Descriptions.Item>
                                <Descriptions.Item label="게스트조건">
                                    {guestCondText}{(data.guestMaxCount || 0) > 0 ? `, 총 ${data.guestMaxCount}명` : ''}
                                </Descriptions.Item>
                            </>
                        ) : (
                            <Descriptions.Item label={isOwnerAuthor ? '게스트조건' : '오너조건'}>
                                {(isOwnerAuthor ? guestCondText : ownerCondText) + ', 총 1명'}
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="드라이브 타입">
                            {driveTypeList.length > 0 ? (
                                <Space wrap>
                                    {driveTypeList.map((k) => (
                                        <Tag key={k} color="purple">{driveTypeLabelMap[k] || k}</Tag>
                                    ))}
                                </Space>
                            ) : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="소개글">
                            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{data.content || '-'}</Paragraph>
                        </Descriptions.Item>
                    </Descriptions>

                    {data.photos?.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <Text strong>사진</Text>
                            <div style={{ marginTop: 8 }}>
                                <Image.PreviewGroup>
                                    <Space wrap>
                                        {data.photos.map((photo, i) => (
                                            <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                                                <Image
                                                    src={photo.imageUrl ? `${STORAGE_URL}${photo.imageUrl}` : undefined}
                                                    width={100}
                                                    height={100}
                                                    style={{ objectFit: 'cover', borderRadius: 4 }}
                                                />
                                                <Button
                                                    type="link"
                                                    danger
                                                    size="small"
                                                    style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.8)' }}
                                                    onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.idx || i); }}
                                                >
                                                    X
                                                </Button>
                                            </div>
                                        ))}
                                    </Space>
                                </Image.PreviewGroup>
                            </div>
                        </div>
                    )}
                </Card>

                {/* 신청현황 */}
                <Card title="신청현황" style={{ flex: 1 }}>
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>확정인원 {confirmedList.length}명</Text>
                        <div style={{ marginTop: 8 }}>
                            {confirmedList.length === 0 && <Text type="secondary">없음</Text>}
                            {confirmedList.map((p) => (
                                <div key={p.isAuthor ? `author-${p.userIdx}` : (p.idx || p.userIdx)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Avatar src={p.profileImage ? `${STORAGE_URL}${p.profileImage}` : undefined} icon={<UserOutlined />} />
                                    <div style={{ flex: 1 }}>
                                        <Space wrap>
                                            <Text>{p.nickname || p.name}</Text>
                                            {p.isAuthor && <Tag color="gold">작성자</Tag>}
                                            {!p.isAuthor && (
                                                <Tag color={participantStatusColorMap[p.status] || 'default'}>
                                                    {participantStatusLabelMap[p.status] || p.status}
                                                </Tag>
                                            )}
                                            {p.noShow && <Tag color="red">매칭불참</Tag>}
                                        </Space>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {p.age != null && `${p.age}세`} {genderLabelMap[p.gender] || '-'}
                                        </Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Text strong>신청인원 {applicantList.length}명</Text>
                        <div style={{ marginTop: 8 }}>
                            {applicantList.length === 0 && <Text type="secondary">없음</Text>}
                            {applicantList.map((p) => (
                                <div key={p.idx || p.userIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Avatar src={p.profileImage ? `${STORAGE_URL}${p.profileImage}` : undefined} icon={<UserOutlined />} />
                                    <div style={{ flex: 1 }}>
                                        <Space wrap>
                                            <Text>{p.nickname || p.name}</Text>
                                            <Tag color={participantStatusColorMap[p.status] || 'default'}>
                                                {participantStatusLabelMap[p.status] || p.status}
                                            </Tag>
                                            {p.noShow && <Tag color="red">매칭불참</Tag>}
                                        </Space>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {p.age != null && `${p.age}세`} {genderLabelMap[p.gender] || '-'}
                                        </Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* 채팅 */}
                <Card title="채팅" style={{ flex: 1, minWidth: 0 }} styles={{ body: { padding: 0, minWidth: 0 } }}>
                    <div
                        ref={chatScrollRef}
                        style={{
                            maxHeight: 520,
                            overflowY: 'auto',
                            padding: '12px 14px',
                            background: '#f5f6f8',
                            borderRadius: 4,
                        }}
                    >
                        {(!data.chatMessages || data.chatMessages.length === 0) && (
                            <Text type="secondary">채팅 내역이 없습니다.</Text>
                        )}
                        {(data.chatMessages || []).map((msg, i, arr) => {
                            const isAuthor = msg.userIdx === data.authorIdx
                            const prev = arr[i - 1]
                            const next = arr[i + 1]
                            const sameSenderAsPrev = prev && prev.userIdx === msg.userIdx
                            const sameSenderAsNext = next && next.userIdx === msg.userIdx
                            const sameMinuteAsNext = next
                                && dayjs(msg.createdAt).format('YYYY-MM-DD HH:mm') === dayjs(next.createdAt).format('YYYY-MM-DD HH:mm')
                                && next.userIdx === msg.userIdx
                            // 프로필 이미지 노출 기준:
                            //   - 본인(작성자) 메시지: 미표시
                            //   - 상대방 메시지: 그룹의 첫 메시지(=직전 메시지 발신자가 다르거나 첫 메시지)에만 표시
                            //   - 그 외 위치: 같은 폭(28px)의 placeholder로 정렬 유지
                            const showAvatar = !isAuthor && !sameSenderAsPrev
                            const showNickname = !isAuthor && !sameSenderAsPrev
                            const showTime = !sameMinuteAsNext
                            const showDateDivider = !prev
                                || dayjs(prev.createdAt).format('YYYY-MM-DD') !== dayjs(msg.createdAt).format('YYYY-MM-DD')
                            return (
                                <div key={i}>
                                    {showDateDivider && (
                                        <div style={{ textAlign: 'center', margin: '12px 0' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 10px',
                                                background: '#e5e7eb',
                                                color: '#666',
                                                fontSize: 11,
                                                borderRadius: 10,
                                            }}>
                                                {dayjs(msg.createdAt).format('YYYY년 M월 D일')}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: isAuthor ? 'row-reverse' : 'row',
                                            alignItems: 'flex-start',
                                            gap: 6,
                                            marginBottom: sameSenderAsNext ? 2 : 10,
                                        }}
                                    >
                                        {!isAuthor && (
                                            <div style={{ width: 28, flexShrink: 0 }}>
                                                {showAvatar ? (
                                                    <Avatar
                                                        src={msg.profileImage ? `${STORAGE_URL}${msg.profileImage}` : undefined}
                                                        icon={<UserOutlined />}
                                                        size={28}
                                                    />
                                                ) : null}
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isAuthor ? 'flex-end' : 'flex-start',
                                                maxWidth: '70%',
                                                minWidth: 0,
                                            }}
                                        >
                                            {showNickname && (
                                                <Text style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>
                                                    {msg.nickname || '-'}
                                                </Text>
                                            )}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: isAuthor ? 'row-reverse' : 'row',
                                                    alignItems: 'flex-end',
                                                    gap: 4,
                                                }}
                                            >
                                                {msg.type === 'image' ? (
                                                    <Image.PreviewGroup>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: isAuthor ? 'flex-end' : 'flex-start' }}>
                                                            {parseImageUrls(msg.content).map((url, ii) => (
                                                                <Image
                                                                    key={ii}
                                                                    src={`${STORAGE_URL}${url}`}
                                                                    style={{
                                                                        width: '100%',
                                                                        maxWidth: 180,
                                                                        height: 'auto',
                                                                        objectFit: 'cover',
                                                                        borderRadius: 12,
                                                                        display: 'block',
                                                                    }}
                                                                    preview={{ mask: false }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </Image.PreviewGroup>
                                                ) : (
                                                    <div
                                                        style={{
                                                            background: isAuthor ? '#1677ff' : '#fff',
                                                            color: isAuthor ? '#fff' : '#222',
                                                            padding: '8px 12px',
                                                            borderRadius: 14,
                                                            borderTopRightRadius: isAuthor && sameSenderAsPrev ? 4 : 14,
                                                            borderTopLeftRadius: !isAuthor && sameSenderAsPrev ? 4 : 14,
                                                            wordBreak: 'break-word',
                                                            whiteSpace: 'pre-wrap',
                                                            boxShadow: isAuthor ? 'none' : '0 1px 1px rgba(0,0,0,0.06)',
                                                            fontSize: 13,
                                                            lineHeight: 1.45,
                                                            maxWidth: '100%',
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                )}
                                                {showTime && (
                                                    <span style={{ fontSize: 10, color: '#999', flexShrink: 0, marginBottom: 2 }}>
                                                        {msg.createdAt ? dayjs(msg.createdAt).format('HH:mm') : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Card>
            </div>
        </>
    )
}
