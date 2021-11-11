import { useEffect, useRef } from "react";
import Map from 'ol/Map';
import { initMapBD09, initMap, drawLine, sadian, gcj02towgs84, addDrawLayer, styles, wgs84togcj02 } from '../../utils/map';
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
        drawLayer: VectorLayer<VectorSource<Geometry>>, /* 绘制图层 */
        mapInstance: Map, /* 地图实例 */
        menuOverlay: Overlay, /* contextMenu的overlay */
        currentLineFeature: Feature<LineString> | undefined/* 当前线条的Feature */
        currentPointFeature: Feature<Point> | undefined /* 当前点位的Feature */
    }>({} as any);

    const menuRef = useRef<any>();
    useClickAway(() => {
        if (mapRef.current.menuOverlay) {
            mapRef.current.menuOverlay.setPosition(undefined);
        }
    }, menuRef);

    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const temp = initMap('kzKyk');
        mapRef.current.mapInstance = temp.mapIns;
        mapRef.current.menuOverlay = temp.menuOverlay;

        mapRef.current.drawInfo = addDrawLayer(mapRef.current.mapInstance, drawEnd);
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
                e.feature.setStyle(styles);
                e.feature.set('modalVisible', true)
                const points = e.feature.getGeometry().getCoordinates().map(item => {
                    return toLonLat(item);
                });
                console.log('绘制后的路径（高德）:' + JSON.stringify(points))
                mapRef.current.currentLineFeature = e.feature;
                mapRef.current.drawInfo.drawLine.setActive(false);
                update();
                break;
            case 'Point':
                e.feature.set('modalVisible', true);
                const point = toLonLat(e.feature.getGeometry().getCoordinates());
                console.log('绘制后的点位（高德）:' + JSON.stringify(point));
                mapRef.current.currentPointFeature = e.feature;
                mapRef.current.drawInfo.drawPoint.setActive(false);
                update();
                break;
        }
    }

    /* 设置起点 */
    function setStartPoint() {
        const start = mapRef.current.menuOverlay.getPosition();
        if (start) {
            const startPoint = mapRef.current.mapInstance.getLayers().getArray().filter(item => {
                return item.get('id') === 'startPoint'
            })[0];
            mapRef.current.menuOverlay.setPosition(undefined);
            if (startPoint) {
                mapRef.current.mapInstance.removeLayer(startPoint);
            }
            sadian(start, mapRef.current.mapInstance, true, StartPointImg, 'startPoint');
            getStartAndEndPoints();
        }
    }

    // /* 设为途径点 */
    function setPassPoint() {
        const point = mapRef.current.menuOverlay.getPosition();
        if (point) {
            const passPoint = mapRef.current.mapInstance.getLayers().getArray().filter(item => {
                return item.get('id') === 'passPoint'
            })[0];
            mapRef.current.menuOverlay.setPosition(undefined);
            if (passPoint) {
                mapRef.current.mapInstance.removeLayer(passPoint);
            }
            sadian(point, mapRef.current.mapInstance, true, PassPointImg, 'passPoint');
            getStartAndEndPoints();
        }
    }

    /* 设置终点 */
    function setEndPoint() {
        const end = mapRef.current.menuOverlay.getPosition();
        if (end) {
            const endPoint = mapRef.current.mapInstance.getLayers().getArray().filter(item => {
                return item.get('id') === 'endPoint'
            })[0];
            mapRef.current.menuOverlay.setPosition(undefined);
            if (endPoint) {
                mapRef.current.mapInstance.removeLayer(endPoint);
            }
            sadian(end, mapRef.current.mapInstance, true, EndPointImg, 'endPoint');
            getStartAndEndPoints();
        }
    }

    function getStartAndEndPoints() {
        const points = mapRef.current.mapInstance.getLayers().getArray().filter(item => { /* 起始点图层 */
            return item.get('id') === 'endPoint' || item.get('id') === 'startPoint'
        });
        const passPoints = mapRef.current.mapInstance.getLayers().getArray().filter(item => { /* 途径点 */
            return item.get('id') === 'passPoint'
        }).map(item => {
            const temp = toLonLat(item.get('position'));
            return gcj02towgs84(temp[0], temp[1]);
        });
        const daohangLine = mapRef.current.mapInstance.getLayers().getArray().filter(item => {
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
                    mapRef.current.mapInstance.getView().animate({
                        center: fromLonLat(points[0]),
                        zoom: 13.5
                    })
                    if (daohangLine) {
                        mapRef.current.mapInstance.removeLayer(daohangLine);
                    }
                    mapRef.current.currentLineFeature = drawLine(points, mapRef.current.mapInstance, 'daohangline');
                    mapRef.current.currentLineFeature.set('modalVisible', true);
                    update();
                }
            })
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
            {
                console.log('重新渲染:' + mapRef.current.drawInfo?.drawPoint.getActive())
            }
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