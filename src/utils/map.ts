import * as d3 from 'd3';

import Map from 'ol/Map';
import View from 'ol/View';
import { register } from 'ol/proj/proj4';
import { fromLonLat, transform, toLonLat } from 'ol/proj'; // 用来转换投影坐标系
import { Group as LayerGroup } from 'ol/layer'; // 图层
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import TileImage from 'ol/source/TileImage';
import TileGrid from 'ol/tilegrid/TileGrid';
import * as olControl from 'ol/control';
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom';
// import TileDebug from 'ol/source/TileDebug';
import proj4 from 'proj4';
import { Icon, Stroke, Style, Text } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import LineString from 'ol/geom/LineString';
import Overlay from 'ol/Overlay';
import { uniqueId } from 'lodash';
// import Geometry from 'ol/geom/Geometry';
import { Draw, Modify } from 'ol/interaction';
import { DrawEvent } from 'ol/interaction/Draw';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
/* openlayer中，使用高德底图，所有坐标均为jcg02坐标 */

const PI = 3.1415926535897932384626;
const a = 6378245.0;
const ee = 0.00669342162296594323;

export const traces: [number, number][] = [
  [
    121.53639557894877,
    31.306469354661342
  ],
  [
    121.53545655082041,
    31.306202702640935
  ],
  [
    121.53208042798343,
    31.30517729448028
  ],
  [
    121.53189703036676,
    31.30515778267121
  ],
  [
    121.5318980058573,
    31.304905682857495
  ],
  [
    121.5320086463194,
    31.30496440635974
  ],
  [
    121.53641151501802,
    31.306311252561606
  ],
  [
    121.53722496067157,
    31.30653423395353
  ],
  [
    121.53870037259172,
    31.306881594830482
  ],
  [
    121.5386746534284,
    31.309266571467354
  ]
]

export function translateFunc(center: [number, number], scale: number) {
  return d3.geoMercator().center(center).scale(scale).rotate([0, 0, 0]).translate([0, 0]); /* 墨卡托投影转换 */
}

/**
 * 初始化地图，返回地图实例
 *
 * @export
 * @return {*} 
 */
export function initMap(targetId: string): { mapIns: Map, menuOverlay: Overlay } {
  const view = new View({
    center: fromLonLat([121.24370643004204, 31.36215757687218]),
    zoom: 12,
    minZoom: 2,
    maxZoom: 18,
  });
  const map_ins = new Map({
    view: view,
    layers: [
      new LayerGroup({
        layers: [
          // new TileLayer({
          //     source: new XYZ({
          //         // 高德底图
          //         // url: 'https://webst04.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}',
          //         // url: 'https://wprd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
          //         url: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',

          //     })
          // }),
          new TileLayer({
            source: new XYZ({
              // 高德底图
              // url: `https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}`
              url: 'http://172.20.62.119:60000/nodejs-wapian/shanghai/pachong/{z}/{y}/{x}.png '
              // url: process.env.REACT_APP_MAP_LOAD_SOURCE2,
            })
          }),
          // new TileLayer({
          //   source: new TileDebug()
          // })
          // new TileLayer({
          //     source: new XYZ({
          //         // 高德底图
          //         url: process.env.REACT_APP_MAP_LOAD_SOURCE2,
          //     })
          // }),
        ]
      }),
    ],
    target: targetId,
    controls: olControl.defaults({
      attribution: false,
      rotate: false,
      zoom: false
    })
  })

  const dblClickInteraction = map_ins
    .getInteractions()
    .getArray()
    .find(interaction => {
      return interaction instanceof DoubleClickZoom;
    });
  if (dblClickInteraction) {
    map_ins.removeInteraction(dblClickInteraction);
  }
  tipOverlay(map_ins);
  return { mapIns: map_ins, menuOverlay: rightClickMenu(map_ins) };
}


export function initMapBD09(targetId: string): Map {

  proj4.defs("EPSG:4008", "+proj=longlat +ellps=clrk66 +no_defs");
  proj4.defs("BD-MC", "+proj=merc +lon_0=0 +units=m +ellps=clrk66 +no_defs");
  register(proj4);

  // 自定义分辨率和瓦片坐标系
  let resolutions: any[] = [];
  let maxZoom = 18;
  // 计算百度使用的分辨率
  for (let i = 0; i <= maxZoom; i++) {
    resolutions[i] = Math.pow(2, maxZoom - i);
  }
  let tilegrid = new TileGrid({
    origin: [0, 0], // 设置原点坐标
    resolutions: resolutions // 设置分辨率
  });
  // 创建百度地图的数据源
  let baiduSource = new TileImage({
    projection: "BD-MC",
    tileGrid: tilegrid,
    tileUrlFunction: function (tileCoord, pixelRatio, proj) {
      let z: any = tileCoord[0];
      let x: any = tileCoord[1];
      let y: any = tileCoord[2] + 1;
      // 百度瓦片服务url将负数使用M前缀来标识
      if (x < 0) {
        x = "M" + -x;
      }
      y = -y;
      if (y < 0) {
        y = "M" + -y;
      }
      return (
        `
        http://maponline1.bdimg.com/tile/?qt=vtile&x=${x}&y=${y}&z=${z}&styles=pl&scaler=1
        `
      );
    }
  });
  // 百度地图层
  let baiduMapLayer = new TileLayer({
    source: baiduSource
  });
  // 创建地图
  return new Map({
    layers: [baiduMapLayer,
      // new TileLayer({
      //   source: new TileDebug()
      // })
    ],
    view: new View({
      center: transform([121.24370643004204, 31.36215757687218], "EPSG:4326", "BD-MC"),
      zoom: 10
    }),
    target: targetId
  });
}

/* 撒点 */
export function sadian(position: number[], mapIns: Map, isMkt?: boolean, img?: any, layerId?: string) {
  const iconFeature = new Feature({
    geometry: new Point(isMkt ? position : fromLonLat(position)),
    population: 4000,
    rainfall: 500,
  });
  iconFeature.setStyle(
    new Style({
      image: new Icon({
        scale: 0.25,
        anchor: [0.5, 1],
        // anchorXUnits: 'fraction',
        // anchorYUnits: 'pixels',
        src: img || '/icon.png',
      }),
    })
  )
  const vectorLayer = new VectorLayer({
    zIndex: 11,
    source: new VectorSource({ features: [iconFeature] })
  });
  vectorLayer.set('position', isMkt ? position : fromLonLat(position));
  if (layerId) {
    vectorLayer.set('id', layerId)
  }
  vectorLayer.set('belong', uniqueId());
  mapIns.addLayer(vectorLayer);
}

/* 画线 */
export function drawLine(positions: number[][], mapIns: Map, lineId?: string) {
  const t: number[][] = [];
  positions = positions.map(item => {
    const a = wgs84togcj02(item[0], item[1]);
    t.push(a);
    return fromLonLat(a)
  });
  console.log('路径点位（高德）:' + JSON.stringify(t))
  const feature = new Feature({
    geometry: new LineString(positions)
  });
  const source = new VectorSource({
    features: [feature],
  })
  const vector = new VectorLayer({
    source,
  });
  if (lineId) {
    vector.set('id', lineId);
  }
  vector.set('belong', uniqueId());
  mapIns.addLayer(vector);
  feature.setStyle(styles);
  feature.set('hasArrow', false);
  feature.set('lineStyle', new Style({
    stroke: new Stroke({
      color: '#666666',
      width: 8,
    }),
  }));
  const style = new Style({
    image: new CircleStyle({
      radius: 10,
      stroke: new Stroke({
        color: '#C1E4FF',
        width: 2,
      }),
      fill: new Fill({
        color: '#577EFF',
      }),
    }),
    text: new Text({
      text: '拖拽更新',
      font: '14px Calibri,sans-serif',
      fill: new Fill({
        color: 'rgba(255, 255, 255, 1)',
      }),
      backgroundFill: new Fill({
        color: 'rgba(0, 0, 0, 0.7)',
      }),
      padding: [2, 2, 2, 2],
      textAlign: 'left',
      offsetX: 15,
    }),
  })
  const modify = new Modify({ source: source, style });
  modify.on('modifyend', e => {
    const points = (e.features.getArray()[0].getGeometry() as LineString).getCoordinates().map(item => {
      return toLonLat(item);
    })
    console.log('更新后的路径（高德）:' + JSON.stringify(points))
  })
  mapIns.addInteraction(modify);
  return feature;
}

/* 添加绘制图层 */
export function addDrawLayer(mapInstance: Map, drawEnd: (e: DrawEvent) => void) {
  const source = new VectorSource();
  const vector = new VectorLayer({
    source,
    style: new Style({
      stroke: new Stroke({
        color: '#666666',
        width: 8,
      }),
      image: new Icon({
        anchor: [0.5, 1],
        src: '/icon.png',
      })
    }),
  });
  mapInstance.addLayer(vector);

  const drawPoint = new Draw({
    source,
    type: 'Point'
  });
  mapInstance.addInteraction(drawPoint);
  drawPoint.on('drawend', drawEnd);
  drawPoint.setActive(false);

  const drawLine = new Draw({
    source,
    type: 'LineString'
  });
  mapInstance.addInteraction(drawLine);
  drawLine.on('drawend', drawEnd);
  drawLine.setActive(false);

  const style = new Style({
    image: new CircleStyle({
      radius: 8,
      stroke: new Stroke({
        color: '#C1E4FF',
        width: 2,
      }),
      fill: new Fill({
        color: '#577EFF',
      }),
    }),
    text: new Text({
      text: '拖拽更新',
      font: '14px Calibri,sans-serif',
      fill: new Fill({
        color: 'rgba(255, 255, 255, 1)',
      }),
      backgroundFill: new Fill({
        color: 'rgba(0, 0, 0, 0.7)',
      }),
      padding: [2, 2, 2, 2],
      textAlign: 'left',
      offsetX: 15,
    }),
  })

  const modify = new Modify({ hitDetection: vector, source: source, style });
  modify.on('modifyend', e => {
    const type = e.features?.getArray()[0]?.getGeometry()?.getType();
    if (type === 'LineString') {
      const points = (e.features.getArray()[0].getGeometry() as LineString).getCoordinates().map(item => {
        return toLonLat(item);
      })
      console.log('更新后的路径（高德）:' + JSON.stringify(points))
    } else if (type === 'Point') {
      const temp = toLonLat((e.features.getArray()[0].getGeometry() as Point).getCoordinates())
      console.log('更新后的点位（高德）:' + JSON.stringify(temp));
    }
  })
  mapInstance.addInteraction(modify);

  return {
    drawPoint, drawLine, vector, modify
  };
}

/* 设置线条样式 */
export const styles = (feature, resolution) => {
  const geometry = feature.getGeometry() as LineString;
  const length = geometry.getLength();
  const radio = (50 * resolution) / length;
  const dradio = 1;
  const styles = [
    feature.get('lineStyle')
  ];
  if (!feature.get('hasArrow')) {
    return styles;
  }
  for (let i = 0; i <= 1; i += radio) {
    const arrowLocation = geometry.getCoordinateAt(i);
    geometry.forEachSegment((start, end) => {
      if (start[0] === end[0] || start[1] === end[1]) return;
      var dx1 = end[0] - arrowLocation[0];
      const dy1 = end[1] - arrowLocation[1];
      const dx2 = arrowLocation[0] - start[0];
      const dy2 = arrowLocation[1] - start[1];
      if (dx1 !== dx2 && dy1 !== dy2) {
        if (Math.abs(dradio * dx1 * dy2 - dradio * dx2 * dy1) < 0.001) {
          const dx = end[0] - start[0];
          const dy = end[1] - start[1];
          const rotation = Math.atan2(dy, dx);
          styles.push(new Style({
            geometry: new Point(arrowLocation),
            image: new Icon({
              src: '/icons/arrow-left.png',
              scale: 0.1,
              // anchor: [0.75, 0.5],
              rotateWithView: false,
              rotation: -rotation + Math.PI
            })
          }));
        }
      }
    })
  }
  return styles;
}

export function tipOverlay(mapIns: Map) {
  const tipOverlay = new Overlay({
    id: 'tip-map',
    element: document.getElementById('tip-map') as any,
    offset: [8, -16]
  });
  mapIns.addOverlay(tipOverlay);
  console.log(mapIns.getInteractions().getArray())
  mapIns.on('pointermove', ev => {
    const flag = mapIns.getInteractions().getArray().filter(item => {
      return item instanceof Draw && item.getActive()
    }).length > 0;
    if (flag) {
      tipOverlay.setPosition(ev.coordinate)
    } else {
      tipOverlay.setPosition(undefined);
    }
  })
}

/**
 * 鼠标右键出现菜单
 *
 * @export
 * @param {Map} mapIns
 */
export function rightClickMenu(mapIns: Map) {
  const menuOverlay = new Overlay({
    id: 'contextMenu',
    element: document.getElementById('context-menu') as any,
    positioning: 'center-center',
  });
  mapIns.addOverlay(menuOverlay);
  mapIns.getViewport().oncontextmenu = ev => {
    ev.preventDefault();
    const coordinate = mapIns.getEventCoordinate(ev);
    console.log('鼠标右键')
    menuOverlay.setPosition(coordinate);
  }
  return menuOverlay;
}

/**
 * 判断是否在国内，不在国内则不做偏移
 * @param lng
 * @param lat
 * @returns {boolean}
 */
export function out_of_china(lng: number, lat: number): boolean {
  return (lng < 72.004 || lng > 137.8347) || ((lat < 0.8293 || lat > 55.8271) || false);
}

/**
* WGS84转GCj02
* @param lng
* @param lat
* @returns {*[]}
*/
export function wgs84togcj02(lng: number, lat: number) {
  if (out_of_china(lng, lat)) {
    return [lng, lat]
  }
  else {
    var dlat = transformlat(lng - 105.0, lat - 35.0);
    var dlng = transformlng(lng - 105.0, lat - 35.0);
    var radlat = lat / 180.0 * Math.PI;
    var magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    var sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * Math.PI);
    dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * Math.PI);
    var mglat = lat + dlat;
    var mglng = lng + dlng;
    return [mglng, mglat]
  }
}

/**
 * GCJ02 转换为 WGS84
 * @param lng
 * @param lat
 * @returns {*[]}
 */
export function gcj02towgs84(lng, lat) {
  if (out_of_china(lng, lat)) {
    return [lng, lat]
  }
  else {
    var dlat = transformlat(lng - 105.0, lat - 35.0);
    var dlng = transformlng(lng - 105.0, lat - 35.0);
    var radlat = lat / 180.0 * PI;
    var magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    var sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
    dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
    var mglat = lat + dlat;
    var mglng = lng + dlng;
    return [lng * 2 - mglng, lat * 2 - mglat]
  }
}

function transformlat(lng: number, lat: number) {
  var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
  return ret
}

function transformlng(lng: number, lat: number) {
  var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
  return ret
}