import { v4 as uuid } from 'uuid';
import dayjs from "dayjs";

import { randomNumberCreate, createNick, createName } from "@/libs/utils";

const kinderNames = ["브리딩유치원", "브리딩 kindergarten", "한국유치원", "Atopes", "해피퍼피강아지유치원", "가치있개 반려견유치원 & 미용실"];
const classNames = ["소형견반", "중형견반", "대형견반", "아름반", "해바라기반", "장미반"];
const names = ["박다현", "김나은", "류은지", "주민지", "조혜원", "류희현", "오도연", "김규진", "김규희", "신은지"];

export default {
    reservList: [
        {idx: 1, kinder_name: '브리딩1 유치원'},
        {idx: 2, kinder_name: '브리딩2 유치원'},
        {idx: 3, kinder_name: '브리딩3 유치원'},
        {idx: 4, kinder_name: '브리딩4 유치원'},
        {idx: 5, kinder_name: '브리딩5 유치원'},
        {idx: 6, kinder_name: '브리딩6 유치원'},
        {idx: 7, kinder_name: '브리딩7 유치원'},
        {idx: 8, kinder_name: '브리딩8 유치원'},
        {idx: 9, kinder_name: '브리딩9 유치원'},
        {idx: 10, kinder_name: '브리딩10 유치원'},
    ],

    getUsers: (len=10) => {
        let arr = [];
        for (let i = 0; i < len; i++) {
    
            const bg = Math.round(Math.random() * 0xffffff).toString(16);
            const cl = Math.round(Math.random() * 0xffffff).toString(16);
            const height = randomNumberCreate({start: 100, end: 1000});
            const age = randomNumberCreate({start: 70, end: 99});

            arr.push({ 
                idx: uuid(),
                email: `test${i}@test.com`,
                name: createName(),
                nickname: createNick(),
                sex: i%2 + 1,
                age: age,
                height: '170cm~174cm',
                job: '사무직',
                score: '3점',
                mbti: 'INFJ',
                type: ['이상적인', '애교있는', '감성적인'],
                interest: ['재테크', '스포츠', '사진'],
                smoke: '가끔 한다',
                drink: '가끔 한다',
                religion: '천주교',
                preferred_date: ['캠핑하기', '맛집탐방', '노래방가기'],
                
                profile: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`,

                sido: `OO광역시`,
                sigungu: `OOO구`,

                reservation_dt: dayjs().subtract(i*10, 'hours').format('YYYY-MM-DD HH:mm:ss'),
                create_dt: dayjs().subtract(18, 'months').add(i*10, 'hours').format('YYYY-MM-DD HH:mm:ss'),

                // title: `제목입니다 ${i}.`,
                // desc: `내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}`,
                // addr: `서울 강동구 고덕로 23, 101-${i}`,
                // name: names[randomNumberCreate({start: 0, end: names?.length-1})],
                // kinder_name: kinderNames[randomNumberCreate({start: 0, end: kinderNames?.length-1})],
                // class_name: classNames[randomNumberCreate({start: 0, end: classNames?.length-1})],
                
                // tel: "02-1234-6522",
                // price: randomNumberCreate({start: 5000, end: 200000}),
                
                // photo: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`,
                // count: randomNumberCreate({start: 0, end: 2000})
            })
        }
    
        return arr;
    },

    getDummys: (len=10) => {
        let arr = [];
        for (let i = 0; i < len; i++) {
    
            const bg = Math.round(Math.random() * 0xffffff).toString(16);
            const cl = Math.round(Math.random() * 0xffffff).toString(16);
            const height = randomNumberCreate({start: 100, end: 1000});
    
            arr.push({ 
                idx: uuid(),
                title: `제목입니다 ${i}.`,
                desc: `내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}내용입니다${i}`,
                addr: `서울 강동구 고덕로 23, 101-${i}`,
                name: names[randomNumberCreate({start: 0, end: names?.length-1})],
                kinder_name: kinderNames[randomNumberCreate({start: 0, end: kinderNames?.length-1})],
                class_name: classNames[randomNumberCreate({start: 0, end: classNames?.length-1})],
                create_dt: dayjs().subtract(i*10, 'hours').format('YYYY-MM-DD HH:mm:ss'),
                reservation_dt: dayjs().add(7, 'days').subtract(i, 'days').format('YYYY-MM-DD HH:mm:ss'),
                tel: "02-1234-6522",
                price: randomNumberCreate({start: 5000, end: 200000}),
                
                photo: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`,
                count: randomNumberCreate({start: 0, end: 2000})
            })
        }
    
        return arr;
    },


    getChatDummys: ({len=10, month=0, user}) => {

        let arr = [];
        for (let i = 0; i < len; i++) {
    
            const bg = Math.round(Math.random() * 0xffffff).toString(16);
            const cl = Math.round(Math.random() * 0xffffff).toString(16);
            const width = randomNumberCreate({start: 800, end: 2500});
            const height = randomNumberCreate({start: 100, end: 1000});
            
            let ob = {};
            if(i === 0) {
                ob.type = 'notice';
                ob.data = `닉네임 님께 대화를 신청했어요! 🙋`;
            } else if(i === 1) {
                ob.type = 'profile';
                ob.data = `user`;
            } else if(i === 2) {
                ob.type = 'notice';
                ob.data = `간단한 인사 부탁드리며, 채팅은 1회만 가능하오니\n신중하게 메시지를 작성해 주세요. 🥰`;
            } else if((i+1)%5 === 0) {
                ob.type = 'image';
                ob.data = [
                    `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`,
                    `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`,
                    `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`,
                    `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`,
                ];
            } else {
                ob.type = 'text';
                ob.data = `내용입니다${i}`;
            }

            arr.push({
                ...ob,
                idx: uuid(),
                create_dt: dayjs('2024-09-01').subtract(month, 'months').add(i*5, 'hours').format('YYYY-MM-DD HH:mm:ss'),
                user: i === 0 ? {} : (
                    user || {
                        idx: uuid(),
                        nickname: createNick(),
                        profile: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`,
                    }
                ),
                
            })
        }

        return arr;
    },

    getChatSend: ({ data, user }) => {

        const bg = Math.round(Math.random() * 0xffffff).toString(16);
        const cl = Math.round(Math.random() * 0xffffff).toString(16);
        const width = randomNumberCreate({start: 800, end: 2500});
        const height = randomNumberCreate({start: 100, end: 1000});
        
        let ob = data;
        if(ob.type === 'image') {
            ob.type = 'image';
            ob.data = ob.data.map((x, i) => {
                const bg = Math.round(Math.random() * 0xffffff).toString(16);
                const cl = Math.round(Math.random() * 0xffffff).toString(16);
                const height = randomNumberCreate({start: 100, end: 1000});
                return `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`;
            })
        }

        return {
            ...ob,
            idx: uuid(),
            create_dt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            user: user || {
                idx: uuid(),
                nickname: createNick(),
                profile: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`,
            },
            
        }
    },












    getScheduleDummys: (len=10) => {
        let arr = [
            {idx: uuid(), title: `제목입니다\n제목입니다 `, name: names[randomNumberCreate({start: 0, end: names?.length-1})], sdate: dayjs().format("YYYY-MM-DD 08:00:00"), edate: dayjs().format("YYYY-MM-DD 09:00:00"), bg: "#" + Math.round(Math.random() * 0xffffff).toString(16), bar: "#" + Math.round(Math.random() * 0xffffff).toString(16) },
            {idx: uuid(), title: `제목입니다\n제목입니다\n제목입니다 `, name: names[randomNumberCreate({start: 0, end: names?.length-1})], sdate: dayjs().format("YYYY-MM-DD 09:00:00"), edate: dayjs().format("YYYY-MM-DD 10:00:00"), bg: "#" + Math.round(Math.random() * 0xffffff).toString(16), bar: "#" + Math.round(Math.random() * 0xffffff).toString(16)},
            {idx: uuid(), title: `제목입니다\n제목입니다\n제목입니다\n제목입니다 `, name: names[randomNumberCreate({start: 0, end: names?.length-1})], sdate: dayjs().format("YYYY-MM-DD 11:00:00"), edate: dayjs().format("YYYY-MM-DD 12:00:00"), bg: "#" + Math.round(Math.random() * 0xffffff).toString(16), bar: "#" + Math.round(Math.random() * 0xffffff).toString(16)},
            {idx: uuid(), title: `제목입니다\n제목입니다\n제목입니다\n제목입니다 `, name: names[randomNumberCreate({start: 0, end: names?.length-1})], sdate: dayjs().format("YYYY-MM-DD 12:00:00"), edate: dayjs().format("YYYY-MM-DD 13:00:00"), bg: "#" + Math.round(Math.random() * 0xffffff).toString(16), bar: "#" + Math.round(Math.random() * 0xffffff).toString(16)},
            {idx: uuid(), title: `제목입니다\n제목입니다\n제목입니다 `, name: names[randomNumberCreate({start: 0, end: names?.length-1})], sdate: dayjs().format("YYYY-MM-DD 13:00:00"), edate: dayjs().format("YYYY-MM-DD 16:00:00"), bg: "#" + Math.round(Math.random() * 0xffffff).toString(16), bar: "#" + Math.round(Math.random() * 0xffffff).toString(16)},
            {idx: uuid(), title: `제목입니다\n제목입니다 `, name: names[randomNumberCreate({start: 0, end: names?.length-1})], sdate: dayjs().format("YYYY-MM-DD 16:30:00"), edate: dayjs().format("YYYY-MM-DD 16:40:00"), bg: "#" + Math.round(Math.random() * 0xffffff).toString(16), bar: "#" + Math.round(Math.random() * 0xffffff).toString(16)},
        ]
       
    
        return arr;
    },

    getBoardDummys: (len=10) => {
        let arr = [];
        for (let i = 0; i < len; i++) {
    
            const bg = Math.round(Math.random() * 0xffffff).toString(16);
            const cl = Math.round(Math.random() * 0xffffff).toString(16);
            const width = randomNumberCreate({start: 800, end: 2500});
            const height = randomNumberCreate({start: 100, end: 1000});
    
            arr.push({ 
                idx: uuid(),
                title: `${dayjs().subtract(i, 'days').format('M월D일')} 교육활동`,
                create_dt: dayjs().subtract(i, 'days').format('YYYY-MM-DD HH:mm:ss'),
                
                data: [
                    {idx: uuid(), type: 'img', url: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`},
                    {idx: uuid(), type: 'video', url: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`, video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'},
                    {idx: uuid(), type: 'video', url: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`, video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'},
                    {idx: uuid(), type: 'img', url: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`},
                    {idx: uuid(), type: 'img', url: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`},
                    {idx: uuid(), type: 'img', url: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`},
                    {idx: uuid(), type: 'img', url: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`},
                    {idx: uuid(), type: 'img', url: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`},
                    {idx: uuid(), type: 'img', url: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`},
                    {idx: uuid(), type: 'img', url: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`},
                    {idx: uuid(), type: 'img', url: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`},
                ],
                count: randomNumberCreate({start: 5, end: 30})
            })
        }
    
        return arr;
    },

    getChatDummysReceive: (option) => {

        const bg = Math.round(Math.random() * 0xffffff).toString(16);
        const cl = Math.round(Math.random() * 0xffffff).toString(16);
        const width = randomNumberCreate({start: 800, end: 2500});
        const height = randomNumberCreate({start: 100, end: 1000});
        
        let arr = [
            {
                _id: uuid(),
                createdAt: new Date(),
                text: option?.image ? null : "메시지 수신하기 입니다.",
                system: option?.system || false,
                image: option?.image ? [
                    `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`, 
                    `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`, 
                    `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`,
                    `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`,
                    `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`,
                    `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`,
                    `https://placehold.co/${width}x${height}/${bg}/${cl}.JPEG`,
                ] : null,
                user: {
                    _id: 100,
                    name: '발신자 선생님',
                    avatar: `https://placehold.co/350x${height}/${bg}/${cl}.JPEG`,
                },
            }
        ];
       
        return arr;
    },
    
};  
  
