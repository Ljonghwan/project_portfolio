import consts from "@/libs/consts";
import images from "@/libs/images";
import routes from "@/libs/routes";
import dummy from "@/libs/dummy";
import API from "@/libs/api";

export default function Component({
    item,
    thumb,
    thumbBg,
    tags
}) {


    return (
        <div className={'portfolio-box list'}>
            <div className={'bg'}>
                <img className={'bg_img'} src={item?.thumb ? (item?.thumb?.base || (consts.s3Url + item?.thumb)) : "/og.png"} />
                <div className={'dim'}></div>
            </div>
            <div className={'bg_hover'}>
                <img className={'bg_img'} src={item?.thumbBg ? (item?.thumbBg?.base || (consts.s3Url + item?.thumbBg)) : "/og.png"}  />
            </div>
            <div className={'data'}>
                <div className={'top'}>
                    <p className={`title`}>{item?.title}</p>
                    <button className={'portpolio_detail_btn'} type="button"></button>
                </div>
                <div className={'bottom'}>
                    <div className={'tags'}>
                        {item?.cate?.map((x, i) => {
                            return (
                                <p key={i}>{x}</p>
                            )
                        })}
                    </div>
                    <p>detail</p>
                </div>
            </div>
        </div>
    )
}
