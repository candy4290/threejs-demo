import GisMap from 'ol/Map';
import { fromLonLat } from 'ol/proj'; // 用来转换投影坐标系
// import TileDebug from 'ol/source/TileDebug';
import { Icon, Stroke, Style, Text } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import LineString from 'ol/geom/LineString';
// import Geometry from 'ol/geom/Geometry';
import Fill from 'ol/style/Fill';
/* openlayer中，使用高德底图，所有坐标均为jcg02坐标 */
import { getVectorContext } from 'ol/render';
import RenderEvent from 'ol/render/Event';
// import MoveCarImg from './car_move.png';
// import StartPointImg from '@imgs/map/6起点.png';
// import EndPointImg from '@imgs/map/9终点.png';
import Geometry from 'ol/geom/Geometry';
import { Options } from 'ol/style/Text';

const MoveCarImg = `data:image/png;base64,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`;
const ArrowLeftImg = `data:image/png;base64,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`;

interface TraceInfo {
  map: GisMap;
  speed: number /* 车速 */;
  distance: number /* 0-1 小车运行进度 */;
  lastTime: number;
  moveCarImg: string /* 小车图标 */;
  headText: string /* 图标上方的说明文字，例如：车牌号 */;
  headTextOptions: Options /* 图标上方的说明文字的Options */;
  traceList: number[][] /* 轨迹列表 */;
  route: LineString /* 轨迹的线条 */;
  loop: boolean; /* 循环播放 */
  vectorLayer: VectorLayer<VectorSource<Geometry>> /* 轨迹的图层 */;
  geoMarker: Feature<Geometry> /* 小车的Feature */;
  position: Point /* 辅助小车移动的点位 */;
  lastRotation: number /* 小车最后位置的倾斜角 */;
  styles: {
    startIcon: Style;
    endIcon: Style;
    helpMarker: Style;
    geoMarker: Style;
  };
  moveFeature?: any;
  hasAnimation?: boolean /* 是否拥有动画 */;
}

class TraceAnimate {
  routerMap = new Map<string, TraceInfo>();

  /**
   * 线条style,增加箭头样式，前提需要feature.set('hasArrow', true)
   *
   * @param {FeatureLike} feature
   * @param {number} resolution
   * @return {*}  {StyleLike}
   * @memberof TraceAnimate
   */
  static stylesGlobal(feature: any, resolution: any): Style[] {
    const geometry = feature.getGeometry() as LineString;
    const length = geometry.getLength();
    const radio = (50 * resolution) / length;
    const dradio = 1;
    const styles = [feature.get('lineStyle')];
    if (!feature.get('hasArrow')) {
      return styles;
    }
    for (let i = 0; i <= 1; i += radio) {
      const arrowLocation = geometry.getCoordinateAt(i);
      geometry.forEachSegment((start, end) => {
        if (start[0] === end[0] || start[1] === end[1]) return;
        const dx1 = end[0] - arrowLocation[0];
        const dy1 = end[1] - arrowLocation[1];
        const dx2 = arrowLocation[0] - start[0];
        const dy2 = arrowLocation[1] - start[1];
        if (dx1 !== dx2 && dy1 !== dy2) {
          if (Math.abs(dradio * dx1 * dy2 - dradio * dx2 * dy1) < 0.001) {
            const dx = end[0] - start[0];
            const dy = end[1] - start[1];
            const rotation = Math.atan2(dy, dx);
            styles.push(
              new Style({
                geometry: new Point(arrowLocation),
                image: new Icon({
                  src: ArrowLeftImg,
                  scale: 0.1,
                  // anchor: [0.75, 0.5],
                  rotateWithView: false,
                  rotation: -rotation + Math.PI,
                }),
              }),
            );
          }
        }
      });
    }
    return styles;
  }

  moveFeature(id: string, event: RenderEvent) {
    /* 移动物体 */
    const routeRef = this.routerMap.get(id);
    if (!routeRef?.speed || !routeRef.hasAnimation) {
      return;
    }
    const time = event.frameState?.time || 0;
    const elapsedTime = time - routeRef.lastTime;
    routeRef.distance = (routeRef.distance + (routeRef.speed * elapsedTime) / 1e6) % 2;
    routeRef.lastTime = time;
    if (routeRef.distance >= 1) {
      routeRef.distance = 1;
      routeRef.lastRotation =
        -Math.atan2(
          routeRef.route.getCoordinateAt(1)[1] - routeRef.route.getCoordinateAt(0.999)[1],
          routeRef.route.getCoordinateAt(1)[0] - routeRef.route.getCoordinateAt(0.999)[0],
        ) -
        Math.PI / 2.35;
    }
    const currentCoordinate = routeRef.route.getCoordinateAt(routeRef.distance);
    routeRef.position.setCoordinates(currentCoordinate);
    const vectorContext = getVectorContext(event);
    const rotation =
      -Math.atan2(
        routeRef.route.getCoordinateAt(
          routeRef.distance + 0.001 > 1 ? 1 : routeRef.distance + 0.001,
        )[1] - routeRef.route.getCoordinateAt(routeRef.distance)[1],
        routeRef.route.getCoordinateAt(
          routeRef.distance + 0.001 > 1 ? 1 : routeRef.distance + 0.001,
        )[0] - routeRef.route.getCoordinateAt(routeRef.distance)[0],
      ) -
      Math.PI / 2.35;
    routeRef.styles.geoMarker.getImage().setRotation(rotation);
    vectorContext.setStyle(routeRef.styles.geoMarker);
    vectorContext.drawGeometry(routeRef.position);
    if (routeRef.distance === 1) {
      this.stopAnimation(id);
    }
    // tell OpenLayers to continue the postrender animation
    routeRef.map.render();
  }

  /**
   * 开始动画
   *
   * @param {string} id 图层的id
   * @memberof TraceAnimate
   */
  startAnimation(id: string) {
    const routeRef = this.routerMap.get(id);
    if (!routeRef || !routeRef.hasAnimation) {
      return;
    }
    routeRef.lastTime = Date.now();
    routeRef.moveFeature = this.moveFeature.bind(this, id);
    routeRef.vectorLayer.on('postrender', routeRef.moveFeature);
    // hide geoMarker and trigger map render through change event
    routeRef.geoMarker.setGeometry(undefined);
  }

  /**
   * 结束动画
   *
   * @param {string} id 图层的id
   * @memberof TraceAnimate
   */
  stopAnimation(id: string) {
    const routeRef = this.routerMap.get(id);
    if (!routeRef || !routeRef.hasAnimation) {
      return;
    }
    // Keep marker at current animation position
    routeRef.geoMarker.setGeometry(routeRef.position);
    routeRef.geoMarker.setStyle(
      new Style({
        text: new Text({
          text: routeRef.headText,
          textAlign: 'center',
          offsetY: -24,
          offsetX: 0,
          textBaseline: 'middle',
          font: '14px Calibri,sans-serif',
          fill: new Fill({
            color: '#000000',
          }),
          ...routeRef.headTextOptions,
        }),
        image: new Icon({
          anchor: [0.6, 0.5],
          src: routeRef.moveCarImg,
          rotation: routeRef.lastRotation,
        }),
      }),
    );
    routeRef.vectorLayer.un('postrender', routeRef.moveFeature);
    setTimeout(() => {
      routeRef.distance = 0;
      this.startAnimation(id)
    }, 1000)
  }

  /**
   * 重新开始轨迹动画
   *
   * @param {string} id
   * @return {*}
   * @memberof TraceAnimate
   */
  restartAnimation(id: string): void {
    const routeRef = this.routerMap.get(id);
    if (!routeRef) {
      return;
    }
    this.stopAnimation(id);
    routeRef.distance = 0;
    this.startAnimation(id);
  }

  /**
   * 画轨迹动画
   *
   * @param {GisMap} map 地图实例
   * @param {number[][]} traceList 轨迹点位列表
   * @param {boolean} [hasAnimation] 是否拥有轨迹动画（false-只是画出一条线）
   * @param {string} [headText]
   * @param {number} [speed]  速度
   * @param {boolean} [animateToFirstPoint=true]
   * @param {boolean} [hasArrow=true]
   * @param {string} [lineStyle=new Style({
   *     stroke: new Stroke({
   *       color: '#bb9246',
   *       width: 8,
   *     }),
   *   })]
   * @param {Options} [headTextOptions]
   * @param {*} [moveCarImg=MoveCarImg]
   * @param {string} [StartPointImg]
   * @param {string} [EndPointImg]
   * @return {*}  {VectorLayer}
   * @memberof TraceAnimate
   */
  animateLine(
    map: GisMap,
    traceList: number[][],
    hasAnimation: boolean,
    loop: boolean,
    headText?: string,
    speed: number = 100,
    animateToFirstPoint: boolean = true,
    hasArrow: boolean = true,
    lineStyle: Style = new Style({
      stroke: new Stroke({
        color: '#bb9246',
        width: 8,
      }),
    }),
    headTextOptions?: Options,
    moveCarImg: string = MoveCarImg,
    StartPointImg?: string,
    EndPointImg?: string,
  ): VectorLayer<VectorSource<Geometry>> {
    const route = new LineString(traceList.map(item => fromLonLat(item)));
    const routeFeature = new Feature({
      type: 'route',
      geometry: route,
    });
    routeFeature.setStyle(TraceAnimate.stylesGlobal);
    routeFeature.set('hasArrow', hasArrow);
    routeFeature.set('lineStyle', lineStyle);
    if (animateToFirstPoint) {
      map.getView().animate({
        center: fromLonLat(traceList[0]),
        zoom: 13,
      });
    }
    const helpMarker = new Feature({
      type: 'helpMarker',
      geometry: new Point(route.getFirstCoordinate()),
    });
    const startMarker = new Feature({
      type: 'startIcon',
      geometry: new Point(route.getFirstCoordinate()),
    });
    const endMarker = new Feature({
      type: 'endIcon',
      geometry: new Point(route.getLastCoordinate()),
    });
    const position = (startMarker.getGeometry() as Point).clone();
    const geoMarker = new Feature({
      type: 'geoMarker',
      geometry: position,
    });

    const styles = {
      startIcon: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: StartPointImg || MoveCarImg,
        }),
      }),
      endIcon: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: EndPointImg || MoveCarImg,
        }),
      }),
      helpMarker: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          scale: 0,
          src: moveCarImg,
        }),
      }),
      geoMarker: new Style({
        text: new Text({
          text: headText,
          textAlign: 'center',
          offsetY: -24,
          offsetX: 0,
          textBaseline: 'middle',
          font: '14px Calibri,sans-serif',
          fill: new Fill({
            color: '#000000',
          }),
          ...headTextOptions,
        }),
        image: new Icon({
          anchor: [0.6, 0.5],
          src: moveCarImg,
          rotation:
            -Math.atan2(
              route.getCoordinateAt(0.001)[1] - route.getCoordinateAt(0)[1],
              route.getCoordinateAt(0.001)[0] - route.getCoordinateAt(0)[0],
            ) -
            Math.PI / 2.35,
        }),
      }),
    };
    const features = [routeFeature, geoMarker, helpMarker];
    if (StartPointImg && EndPointImg) {
      features.push(...[startMarker, endMarker]);
    }
    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features,
      }),
      style: function (feature) {
        return styles[feature.get('type')];
      },
    });

    map.addLayer(vectorLayer);
    const uuid = this.uuid();
    this.routerMap.set(uuid, {
      map,
      speed,
      distance: 0,
      lastTime: 0,
      moveCarImg: MoveCarImg,
      headText: headText || '',
      headTextOptions: headTextOptions || {},
      traceList,
      route,
      vectorLayer,
      geoMarker,
      position,
      lastRotation: 0,
      styles,
      hasAnimation,
      loop
    });
    this.startAnimation(uuid);
    return vectorLayer;
  }

  uuid() {
    const s: any[] = [];
    const hexDigits = '0123456789abcdef';
    for (let i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr(((s as any)[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = '-';

    const uuid = s.join('');
    return uuid;
  }
}

export default TraceAnimate;
