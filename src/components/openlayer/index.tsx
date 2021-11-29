import { useEffect, useRef } from "react";
import Map from 'ol/Map';
import { initMapBD09, drawLine, sadian, addDrawLayer, formatLength, tipOverlay, rightClickMenu } from '../../utils/map';
import './index.less';
import { useClickAway } from "ahooks";
import Overlay from "ol/Overlay";
import StartPointImg from '@imgs/map/6起点.png';
import PassPointImg from '@imgs/map/经过.png';
import EndPointImg from '@imgs/map/9终点.png';
import { fromLonLat, toLonLat } from "ol/proj";
import axios from "axios";
import PointImg from '@imgs/map/401位置.png';
import LineImg from '@imgs/map/线.png';
import EmptyImg from '@imgs/map/清空.png';
import { Tooltip } from 'antd';
import LineModal from "./components/line-modal";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Geometry from "ol/geom/Geometry";
import { useUpdate } from 'ahooks';
import { Draw, Modify } from 'ol/interaction';
import { DrawEvent } from "ol/interaction/Draw";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import { Stroke, Style } from "ol/style";
import Point from "ol/geom/Point";
import PointModal from "./components/point-modal";
import { gcj02towgs84, TraceAnimate, initMap } from "@kzlib/kmap";
import RightMenu from "./components/right-menu";

/* openlayer地图开发 */
export default function MapTest() {
    const update = useUpdate();

    const mapRef = useRef<{
        drawInfo: {
            drawPoint: Draw;
            drawLine: Draw;
            vector: VectorLayer<VectorSource<Geometry>>;
            modify: Modify
        }
        mapInstance: Map, /* 地图实例 */
        menuOverlay: Overlay, /* contextMenu的overlay */
        currentLineFeature: Feature<LineString> | undefined/* 当前线条的Feature */
        currentPointFeature: Feature<Point> | undefined /* 当前点位的Feature */
    }>({} as any);

    const t = 


    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        // url: `http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x} ` /* 深蓝夜色;到了17级就没了--- */
        // url: `https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}` /* 高德亮色 */
        // url: 'http://172.20.62.119:60000/nodejs-wapian/shanghai/pachong/{z}/{y}/{x}.png '
        mapRef.current.mapInstance = initMap('kzKyk', [121.24370643004204, 31.36215757687218], ['https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}']);
        tipOverlay(mapRef.current.mapInstance);
        mapRef.current.menuOverlay = rightClickMenu(mapRef.current.mapInstance);
        mapRef.current.drawInfo = addDrawLayer(mapRef.current.mapInstance, drawEnd);
        update();
    }

    function drawEnd(e: DrawEvent) {
        const drawType = e.feature.getGeometry().getType();
        switch (drawType) {
            case 'LineString':
                e.feature.set('lineStyle', new Style({
                    stroke: new Stroke({
                        color: '#666666',
                        width: 8,
                    }),
                }))
                e.feature.setStyle(TraceAnimate.stylesGlobal);
                e.feature.set('modalVisible', true)
                const points = e.feature.getGeometry().getCoordinates().map(item => {
                    return toLonLat(item);
                });
                console.log('绘制后的路径（GCJ-02）:' + JSON.stringify(points))
                console.log('路径长度:' + formatLength(e.feature.getGeometry()))
                mapRef.current.currentLineFeature = e.feature;
                mapRef.current.drawInfo.drawLine.setActive(false);
                update();
                break;
            case 'Point':
                e.feature.set('modalVisible', true);
                const point = toLonLat(e.feature.getGeometry().getCoordinates());
                console.log('绘制后的点位（GCJ-02）:' + JSON.stringify(point));
                mapRef.current.currentPointFeature = e.feature;
                mapRef.current.drawInfo.drawPoint.setActive(false);
                update();
                break;
        }
    }

    /* 标点 */
    function drawSelfPoint() {
        const flag = mapRef.current.drawInfo.drawPoint.getActive();
        console.log(flag)
        if (!flag) {
            mapRef.current.drawInfo.drawLine.setActive(false);
        }
        mapRef.current.drawInfo.drawPoint.setActive(!flag);
        update();
    }

    /* 标线 */
    function drawSelfLine() {
        const flag = mapRef.current.drawInfo.drawLine.getActive();
        console.log(flag)
        if (!flag) {
            mapRef.current.drawInfo.drawPoint.setActive(false);
        }
        mapRef.current.drawInfo.drawLine.setActive(!flag);
        update();
    }

    /* 清除人为加入的元素 */
    function empty() {
        const temp = mapRef.current.mapInstance.getLayers().getArray().filter(item => {
            return !!item.get('belong');
        })
        temp.forEach(item => {
            if (item && item instanceof VectorLayer) {
                item.getSource().clear();
            }
            mapRef.current.mapInstance.removeLayer(item);
        });

        const drawSource = mapRef.current.drawInfo.vector.getSource();
        drawSource.clear(); /* /* 清除绘制图层上的内容 */

        /* 置空当前线段feature */
        mapRef.current.currentLineFeature = undefined;
        update();
    }

    return (
        <div className='map-container'>
            <div className='main-map' id='kzKyk'></div>
            {/* 地图工具 */}
            <div className='tools'>
                <Tooltip title="标点" placement="left">
                    <img src={PointImg} alt='' onClick={drawSelfPoint} style={{background: mapRef.current.drawInfo?.drawPoint.getActive() ? '#ddd' : 'none'}} />
                </Tooltip>
                <Tooltip title="标线" placement="left">
                    <img src={LineImg} alt='' onClick={drawSelfLine} style={{background: mapRef.current.drawInfo?.drawLine.getActive() ? '#ddd' : 'none'}} />
                </Tooltip>
                <Tooltip title="清空" placement="left">
                    <img src={EmptyImg} alt='' onClick={empty} />
                </Tooltip>
            </div>
            {/* 右键ContextMenu菜单 */}
            <RightMenu menuOverlay={mapRef.current.menuOverlay} 
            mapInstance={mapRef.current.mapInstance}
            update={update} currentLineFeature={mapRef.current.currentLineFeature} />
            {/* 操作提示 */}
            <div className="ant-tooltip ant-tooltip-placement-right" id='tip-map'>
                <div className="ant-tooltip-content">
                    <div className="ant-tooltip-arrow">
                        <span className="ant-tooltip-arrow-content"></span>
                    </div>
                    {
                        mapRef.current.drawInfo?.drawPoint.getActive() &&
                        <div className="ant-tooltip-inner" role="tooltip">单击标点</div>
                    }
                    {
                        mapRef.current.drawInfo?.drawLine.getActive() &&
                        <div className="ant-tooltip-inner" role="tooltip">单击选择,双击结束</div>
                    }
                </div>
            </div>
            {/* 标线 */
                mapRef.current.currentLineFeature && mapRef.current.currentLineFeature.get('modalVisible') &&
                <LineModal
                    mapInstance={mapRef.current.mapInstance}
                    currentLineFeature={mapRef.current.currentLineFeature} update={update} />
            }
            {/* 标点 */
                mapRef.current.currentPointFeature && mapRef.current.currentPointFeature.get('modalVisible') &&
                <PointModal
                    mapInstance={mapRef.current.mapInstance}
                    currentPointFeature={mapRef.current.currentPointFeature} update={update} />
            }
        </div>
    )
}