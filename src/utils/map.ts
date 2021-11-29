import * as d3 from 'd3';

import Map from 'ol/Map';
import View from 'ol/View';
import { register } from 'ol/proj/proj4';
import { fromLonLat, transform, toLonLat } from 'ol/proj'; // 用来转换投影坐标系
import { Group as LayerGroup, Heatmap } from 'ol/layer'; // 图层
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
import { getLength } from 'ol/sphere';
// import TraceAnimate from '../utils/trace-animate';
import { wgs84togcj02, TraceAnimate } from '@kzlib/kmap';
import GeoJSON from 'ol/format/GeoJSON';
import EChartsLayer from 'ol-echarts'

/* 轨迹点位列表 */
export const traceList = [[121.35517654868337, 31.369691409110867], [121.3553178367902, 31.36971265754803], [121.35568758258347, 31.369697283933963], [121.35585191580782, 31.369721571248128], [121.35622166741209, 31.369822230265], [121.35719263227605, 31.370150968917695], [121.36169141220505, 31.371320671352603], [121.36184567154734, 31.370985811727934], [121.36194485634338, 31.370981967216764], [121.36203803142014, 31.3709981192116], [121.36345769190204, 31.371499489767235], [121.36264933315064, 31.372931675891166], [121.36250810405242, 31.373298567767232], [121.36241493399203, 31.37332643032966], [121.36228368851506, 31.37330221689603], [121.35990711590776, 31.37230411410052], [121.35981794405251, 31.37229596682774], [121.35974781408241, 31.372350869796144], [121.35941124067038, 31.373213587029202], [121.35974781408241, 31.372350869796144], [121.35981794405251, 31.37229596682774], [121.35990711590776, 31.37230411410052], [121.36228368851506, 31.37330221689603], [121.36241493399203, 31.37332643032966], [121.36250810405242, 31.373298567767232], [121.36264933315064, 31.372931675891166], [121.36345769190204, 31.371499489767235], [121.3642281114101, 31.371762753837785]]

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
              // url: `http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x} ` /* 深蓝夜色;到了17级就没了--- */
              url: `https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}` /* 高德亮色 */
              // url: 'http://172.20.62.119:60000/nodejs-wapian/shanghai/pachong/{z}/{y}/{x}.png '
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

  // console.log('-------------------')
  // const animate = new TraceAnimate();
  // const id = animate.animateLine(map_ins, traceList, true, '沪AB1234', 200, true, true).get('id')
  // animate.startAnimation(id)

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
  renderHeatmap(map_ins);
  echartLineEffect(map_ins);
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

/* 路线光效图 */
export function echartLineEffect(map: Map) {
  const busLines = [{
    //G2从左到右
    coords: [
      [121.143388, 31.286542], [121.143814, 31.28619], [121.145631, 31.284617], [121.146737, 31.283606], [121.147933, 31.282456], [121.149255, 31.281136], [121.150544, 31.279778], [121.152391, 31.277696], [121.154659, 31.275025], [121.155878, 31.273562], [121.158083, 31.270981], [121.160175, 31.26855], [121.161536, 31.267041], [121.162245, 31.266304], [121.162978, 31.26559], [121.163728, 31.264886], [121.164505, 31.264202], [121.165298, 31.263528], [121.166115, 31.262883], [121.166966, 31.262242], [121.168702, 31.261033], [121.169595, 31.260458], [121.170508, 31.259898], [121.172382, 31.258848], [121.174344, 31.257893], [121.175354, 31.257435], [121.176373, 31.257015], [121.177982, 31.256391], [121.179493, 31.255865], [121.18056, 31.255536], [121.181641, 31.255224], [121.182717, 31.25495], [121.183802, 31.254695], [121.184899, 31.254465], [121.187111, 31.254078], [121.188223, 31.253927], [121.189342, 31.253798], [121.190467, 31.253693], [121.193211, 31.253485], [121.211384, 31.252223], [121.213314, 31.252109], [121.215216, 31.252025], [121.21786, 31.251952], [121.23643, 31.251584], [121.239504, 31.251555], [121.24073, 31.25156], [121.241959, 31.251585], [121.243185, 31.251635], [121.244454, 31.251699], [121.245641, 31.251783], [121.246866, 31.251888], [121.248089, 31.252014], [121.249312, 31.252161], [121.250527, 31.252327], [121.251748, 31.252519], [121.252964, 31.252735], [121.254968, 31.25312], [121.257781, 31.253733], [121.26187, 31.254681], [121.264153, 31.255167], [121.265296, 31.255377], [121.266452, 31.255561], [121.267612, 31.255712], [121.268778, 31.255844], [121.26994, 31.255949], [121.271114, 31.256022], [121.272282, 31.256072], [121.273454, 31.256091], [121.274624, 31.256082], [121.276957, 31.25593], [121.278119, 31.255831], [121.279274, 31.255704], [121.280428, 31.255555], [121.282006, 31.255314], [121.284031, 31.254937], [121.289468, 31.253823], [121.292437, 31.253261], [121.29348, 31.253092], [121.295544, 31.252829], [121.29973, 31.252442], [121.30077, 31.252378], [121.301813, 31.252328], [121.303904, 31.252262], [121.305975, 31.252256], [121.308102, 31.252304], [121.311047, 31.252423], [121.325528, 31.253097], [121.325567, 31.253131], [121.326831, 31.253195], [121.32788, 31.253316], [121.328395, 31.253342], [121.328953, 31.253342],
    ],

    'lineStyle': {
      'normal': {
        width: 25,
        color: "#ffffff",
        // opacity: 1
        opacity: 0
      }
    }
  }]
  const option = {
    'series': [
      {
        'type': 'lines',
        'polyline': true,
        'data': busLines,
        'lineStyle': {
          'normal': {
            'width': 1,
            'color': '#ffffff'
          }
        },
        'effect': {
          show: true,
          trailWidth: 5,
          trailOpacity: 0.5,
          trailLength: 0.7,
          constantSpeed: 25
        },
        'zlevel': 1
      }
    ]
  }
  //转火星坐标系
  busLines.forEach((item, index) => {
    item.coords.forEach((ite,idx)=>{
        item.coords[idx] = wgs84togcj02(ite[0], ite[1])
    })
})
  const echartsLayer = new EChartsLayer(option, {
    hideOnMoving: false,
    hideOnZooming: false,
    forcedPrecomposeRerender: true
  })
  // echartsLayer.remove() 清除图层
  echartsLayer.appendTo(map);
}

/* 渲染热力图 */
export function renderHeatmap(map: Map) {
  const vector = new Heatmap({
    source: new VectorSource({
      features: (new GeoJSON()).readFeatures({
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Point",
            "coordinates": [
              104.40,
              31.19
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              113.30,
              30.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              123.30,
              30.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              105.30,
              30.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              106.30,
              30.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              109.30,
              31.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              109.30,
              30.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              108.30,
              32.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              118.30,
              31.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              108.30,
              33.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              108.30,
              32.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              100.30,
              30.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              109.30,
              30.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              108.30,
              31.60
            ],
          },
          {
            "type": "Point",
            "coordinates": [
              118.30,
              30.60
            ],
          }
        ]
      }, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
    }),
    blur: 20,
    radius: 20,
    // weight: function (feature) {
    //   // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
    //   // standards-violating <magnitude> tag in each Placemark.  We extract it from
    //   // the Placemark's name instead.
    //   // const name = feature.get('mag');
    //   // return name - 3;
    //   return Math.random()
    // },
  });
  map.addLayer(vector);
}

/* 撒点 */
export function sadian(position: number[], mapIns: Map, isMkt?: boolean, img?: any, layerId?: string) {
  const iconFeature = new Feature({
    geometry: new Point(isMkt ? position : fromLonLat(position))
  });
  let currentRadius = 10;
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
  })
  iconFeature.setStyle(style);

  // setInterval(() => {
  //   const circleStyle = (style.getImage() as CircleStyle);
  //   circleStyle.setRadius(++currentRadius);
  //   circleStyle.getStroke().setColor('rgba(255,0,0,' + (45 - currentRadius) / 45 + ")");
  //   if (currentRadius >= 45) {
  //     currentRadius = 12;
  //   }
  //   iconFeature.setStyle(style);
  // }, 60);

  const vectorLayer = new VectorLayer({
    zIndex: 11,
    source: new VectorSource({
      features: [iconFeature]
    })
  });
  vectorLayer.set('position', isMkt ? position : fromLonLat(position));
  if (layerId) {
    vectorLayer.set('id', layerId)
  }
  vectorLayer.set('belong', uniqueId());
  mapIns.addLayer(vectorLayer);
  // const div = document.createElement('div');
  // const div1 = document.createElement('div');
  // const div2 = document.createElement('div');
  // div.classList.add('parent')
  // div.append(div1)
  // div.append(div2)
  // div1.classList.add('point')
  // div2.classList.add('puffOut')
  // const kuosan = new Overlay({
  //   id: 'expandLight',
  //   element: div,
  //   offset: [-10, -10]
  // });
  // mapIns.addOverlay(kuosan);
  // kuosan.setPosition(isMkt ? position : fromLonLat(position))
}

export const formatLength = function (line: LineString) {
  const length = getLength(line);
  let output: string;
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + ' km';
  } else {
    output = Math.round(length * 100) / 100 + ' m';
  }
  return output;
};

/* 画线 */
export function drawLine(positions: number[][], mapIns: Map, lineId?: string) {
  const t: number[][] = [];
  positions = positions.map(item => {
    const a = wgs84togcj02(item[0], item[1]);
    t.push(a);
    return fromLonLat(a)
  });
  console.log('路径点位（GCJ-02）:' + JSON.stringify(t))
  const feature = new Feature({
    geometry: new LineString(positions)
  });
  const line = feature.getGeometry();
  if (line) {
    console.log('路径长度:' + formatLength(line))
  }
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
  feature.setStyle(TraceAnimate.stylesGlobal);
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
    const line = (e.features.getArray()[0].getGeometry() as LineString);
    const points = line.getCoordinates().map(item => {
      return toLonLat(item);
    })
    console.log('更新后的路径（GCJ-02）:' + JSON.stringify(points))
    if (line) {
      console.log('路径长度:' + formatLength(line))
    }
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
      console.log('更新后的路径（GCJ-02）:' + JSON.stringify(points))
      console.log('路径长度:' + formatLength(e.features.getArray()[0].getGeometry() as LineString))
    } else if (type === 'Point') {
      const temp = toLonLat((e.features.getArray()[0].getGeometry() as Point).getCoordinates())
      console.log('更新后的点位（GCJ-02）:' + JSON.stringify(temp));
    }
  })
  mapInstance.addInteraction(modify);

  return {
    drawPoint, drawLine, vector, modify
  };
}

export function tipOverlay(mapIns: Map) {
  const tipOverlay = new Overlay({
    id: 'tip-map',
    element: document.getElementById('tip-map') as any,
    offset: [8, -16]
  });
  mapIns.addOverlay(tipOverlay);
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

export function getRotation(point1: number[], point2: number[]) {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  return Math.atan2(dy, dx);
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
    menuOverlay.setPosition(coordinate);
  }
  return menuOverlay;
}

