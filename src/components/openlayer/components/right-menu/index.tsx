import { useClickAway } from "ahooks";
import { drawLine, sadian } from "../../../../utils/map";
import StartPointImg from '@imgs/map/6起点.png';
import PassPointImg from '@imgs/map/经过.png';
import EndPointImg from '@imgs/map/9终点.png';
import { Overlay } from "ol";
import Map from 'ol/Map';
import { useRef } from "react";
import { fromLonLat, toLonLat } from "ol/proj";
import { gcj02towgs84 } from "@kzlib/kmap";
import axios from "axios";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";

export default function RightMenu(props: {menuOverlay: Overlay, mapInstance: Map,
    update: () => void, currentLineFeature: Feature<LineString> | undefined}) {
    let {menuOverlay, mapInstance, update, currentLineFeature} = props;
    const menuRef = useRef<any>();

    useClickAway(() => {
        if (menuOverlay) {
            menuOverlay.setPosition(undefined);
        }
    }, menuRef);

    /* 设置起点 */
    function setStartPoint() {
        console.log(menuOverlay)
        const start = menuOverlay.getPosition();
        if (start) {
            const startPoint = mapInstance.getLayers().getArray().filter(item => {
                return item.get('id') === 'startPoint'
            })[0];
            menuOverlay.setPosition(undefined);
            if (startPoint) {
                mapInstance.removeLayer(startPoint);
            }
            sadian(start, mapInstance, true, StartPointImg, 'startPoint');
            getStartAndEndPoints();
        }
    }

    // /* 设为途径点 */
    function setPassPoint() {
        const point = menuOverlay.getPosition();
        if (point) {
            const passPoint = mapInstance.getLayers().getArray().filter(item => {
                return item.get('id') === 'passPoint'
            })[0];
            menuOverlay.setPosition(undefined);
            if (passPoint) {
                mapInstance.removeLayer(passPoint);
            }
            sadian(point, mapInstance, true, PassPointImg, 'passPoint');
            getStartAndEndPoints();
        }
    }

    /* 设置终点 */
    function setEndPoint() {
        const end = menuOverlay.getPosition();
        if (end) {
            const endPoint = mapInstance.getLayers().getArray().filter(item => {
                return item.get('id') === 'endPoint'
            })[0];
            menuOverlay.setPosition(undefined);
            if (endPoint) {
                mapInstance.removeLayer(endPoint);
            }
            sadian(end, mapInstance, true, EndPointImg, 'endPoint');
            getStartAndEndPoints();
        }
    }

    function getStartAndEndPoints() {
        const points = mapInstance.getLayers().getArray().filter(item => { /* 起始点图层 */
            return item.get('id') === 'endPoint' || item.get('id') === 'startPoint'
        });
        const passPoints = mapInstance.getLayers().getArray().filter(item => { /* 途径点 */
            return item.get('id') === 'passPoint'
        }).map(item => {
            const temp = toLonLat(item.get('position'));
            return gcj02towgs84(temp[0], temp[1]);
        });
        const daohangLine = mapInstance.getLayers().getArray().filter(item => {
            return item.get('id') === 'daohangline';
        })[0];
        let passPointsPositions = '';
        passPoints.forEach(item => {
            passPointsPositions += `&point=${item.reverse().join(',')}`
        })
        if (points.length === 2) { /* 起始点都有了 */
            const startEndPosition = (points[0].get('id') === 'startPoint' ? [points[0].get('position'), points[1].get('position')] : [points[1].get('position'), points[0].get('position')]).map((item: any) => {
                const temp = toLonLat(item);
                return gcj02towgs84(temp[0], temp[1])
            });
            axios.get(
                `http://172.20.62.117:8989/route?point=${startEndPosition[0].reverse().join(',')}${passPointsPositions}&point=${startEndPosition[1].reverse().join(',')}&type=json&locale=zh-CN&vehicle=car&weighting=fastest&points_encoded=false`
            ).then(rsp => {
                if (rsp.status + '' === '200') {
                    const points = rsp.data.paths[0].points.coordinates;
                    mapInstance.getView().animate({
                        center: fromLonLat(points[0]),
                        zoom: 13.5
                    })
                    if (daohangLine) {
                        mapInstance.removeLayer(daohangLine);
                    }
                    currentLineFeature = drawLine(points, mapInstance, 'daohangline');
                    currentLineFeature.set('modalVisible', true);
                    update();
                }
            })
        }
    }

    return (
        <div className="context-menu" id="context-menu" ref={menuRef}>
            <div onClick={setStartPoint}>
                <img src={StartPointImg} alt='' />
                <span>设为起点</span>
            </div>
            <div className='split-line'></div>
            <div onClick={setPassPoint}>
                <img src={PassPointImg} alt='' />
                <span>设为途径点</span>
            </div>
            <div className='split-line'></div>
            <div onClick={setEndPoint}>
                <img src={EndPointImg} alt='' />
                <span>设为终点</span>
            </div>
        </div>
    )
}