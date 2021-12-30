import * as THREE from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'; /* 高亮虚幻效果 */
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

/**
 * 创建初始composer&
 *
 * @export
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @return {*} 
 */
export function createComposerAndRenderPass(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): {
  composer: EffectComposer,
  renderPass: RenderPass
} {
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false
  })); /* 用于在Three.js中实现后期处理效果。该类管理了产生最终视觉效果的后期处理过程链。 后期处理过程根据它们添加/插入的顺序来执行，最后一个过程会被自动渲染到屏幕上。 */
  composer.setSize(window.innerWidth, window.innerHeight);

  const renderPass = new RenderPass(scene, camera); /* RenderPass是合成器过程链中的一个过程，它绘制我们的场景和物体，就像它们通常在我们的渲染器中绘制的那样，没有任何影响。这通常是添加到合成器的第一个过程。RenderPass有两个参数，同调用render一样，参数是scene和camera对象。 */
  composer.addPass(renderPass); /* 添加过程 */

  return {
    composer, renderPass
  }
}

/**
  * 呼吸灯效果-物体轮廓发光效果
 *
 * @export
 * @param {THREE.WebGLRenderer} renderer 渲染器
 * @param {THREE.Scene} scene 场景
 * @param {THREE.Camera} camera 相机
 * @param {number} [edgeStrength=3] 粗
 * @param {number} [edgeGlow=1] 发光
 * @param {number} [edgeThickness=2] 光晕粗
 * @param {number} [pulsePeriod=5] 闪烁
 * @param {boolean} [usePatternTexture=false] 是否使用皮肤
 * @param {string} [visibleEdgeColor='#bb9246']
 * @param {string} [hiddenEdgeColor='#190a05']
 * @return {*}  {{composer: EffectComposer, outlinePass: OutlinePass}}
 */
export function createOutLine(
  composer: EffectComposer,
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  edgeStrength: number = 3,
  edgeGlow: number = 1,
  edgeThickness: number = 2,
  pulsePeriod: number = 5,
  usePatternTexture: boolean = false,
  visibleEdgeColor: string = '#bb9246',
  hiddenEdgeColor: string = '#190a05'
): { composer: EffectComposer, outlinePass: OutlinePass } {
  let selectedObjects: any[] = [];
  const mouse = new THREE.Vector2();

  const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
  outlinePass.edgeStrength = edgeStrength; /* 粗 */
  outlinePass.edgeGlow = edgeGlow; /* 发光 */
  outlinePass.edgeThickness = edgeThickness; /* 光晕粗 */
  outlinePass.pulsePeriod = pulsePeriod; /* 闪烁 */
  outlinePass.usePatternTexture = usePatternTexture; /* 是否使用皮肤 */
  outlinePass.visibleEdgeColor.set(visibleEdgeColor);
  outlinePass.hiddenEdgeColor.set(hiddenEdgeColor);
  composer.addPass(outlinePass);

  renderer.domElement.style.touchAction = 'none';
  renderer.domElement.addEventListener('pointermove', onPointerMove);

  function onPointerMove(event) {
    if (event.isPrimary === false) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    checkIntersection();
  }

  function addSelectedObject(object) {
    selectedObjects = [];
    selectedObjects.push(object);
  }

  function checkIntersection() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(scene, true);
    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;
      addSelectedObject(selectedObject);
      outlinePass.selectedObjects = selectedObjects.filter(item => !!item.userData['hasOutlinePass']);
    } else {
      outlinePass.selectedObjects = [];
    }
  }

  return {
    composer, outlinePass
  }
}

/**
 * 创建发光效果
 *
 * @export
 */
export function createUnrealBloomPass(composer: EffectComposer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, selectedObjects: any[] = []): {
  composer: EffectComposer,
  bloomPass: UnrealBloomPass,
} {
  const bloomPass = new (UnrealBloomPass as any)(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85,
    selectedObjects, scene, camera
  );
  bloomPass.threshold = 0;
  bloomPass.strength = 1.5;
  bloomPass.radius = 0;

  composer.addPass(bloomPass);

  return { composer, bloomPass };
}

/**
 * 添加抗锯齿
 *
 * @export
 */
export function createFxaa(composer: EffectComposer) {
  const effectFXAA = new ShaderPass(FXAAShader) /* 自定义的着色器通道 作为参数 */
  effectFXAA.material.uniforms.resolution.value.set(1 / window.innerWidth, 1 / window.innerHeight);
  effectFXAA.renderToScreen = true;
  composer.addPass(effectFXAA);
  return {
    composer, effectFXAA
  }
}

/* 渐变色线段生成方法 */
export function createMovingLine(
  curve: THREE.CatmullRomCurve3, index: number = 0, color = ['#00ffff', '#224242'], pointNum: number = 400, verticNum = 30
) {
  // curve.getLengths() /* 轨迹总长度 */
  const lightGeometry = new LineGeometry();
  const pointsV3 = curve.getPoints(pointNum);
  const temp = pointsV3.slice(index, index + verticNum).reduce((arr: number[], item) => {
    return arr.concat(item.x, item.y, item.z);
  }, []);
  lightGeometry.setPositions(temp);
  const lightMaterial = new LineMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    linewidth: 8,
    depthTest: false, // 慎用
    vertexColors: true,
  });
  // 渐变色处理
  const colors = gradientColors(color[1], color[0], verticNum);
  const colorArr = colors.reduce((arr, item) => {
    const Tcolor = new THREE.Color(item);
    return arr.concat(Tcolor.r, Tcolor.g, Tcolor.b);
  }, []);
  lightGeometry.setColors(colorArr);
  lightMaterial.resolution.set(window.innerWidth, window.innerHeight);
  const lightLine = new Line2(lightGeometry, lightMaterial);
  lightLine.computeLineDistances();
  return {
    index,
    verticNum,
    mesh: lightLine,
    linePointsV3: pointsV3,
  };
}

// 颜色插值
function gradientColors(start: any, end: any, steps: number, gamma?: any) {
  const parseColor = function (hexStr) {
    return hexStr.length === 4
      ? hexStr
        .substr(1)
        .split("")
        .map(function (s) {
          return 0x11 * parseInt(s, 16);
        })
      : [
        hexStr.substr(1, 2),
        hexStr.substr(3, 2),
        hexStr.substr(5, 2),
      ].map(function (s) {
        return parseInt(s, 16);
      });
  };
  const pad = function (s) {
    return s.length === 1 ? `0${s}` : s;
  };
  let j;
  let ms;
  let me;
  const output: any[] = [];
  const so: any[] = [];
  // eslint-disable-next-line
  gamma = gamma || 1;
  const normalize = function (channel) {
    // eslint-disable-next-line
    return Math.pow(channel / 255, gamma);
  };
  // eslint-disable-next-line
  start = parseColor(start).map(normalize);
  // eslint-disable-next-line
  end = parseColor(end).map(normalize);
  for (let i = 0; i < steps; i++) {
    ms = i / (steps - 1);
    me = 1 - ms;
    for (j = 0; j < 3; j++) {
      // eslint-disable-next-line
      so[j] = pad(
        Math.round(
          Math.pow(start[j] * me + end[j] * ms, 1 / gamma) * 255
        ).toString(16)
      );
    }
    output.push(`#${so.join("")}`);
  }
  return output;
}


/**
 * 获取三维空间中鼠标位置
 *
 * @export
 * @param {*} event
 * @param {THREE.PerspectiveCamera} camera
 * @return {*} 
 */
export function getMousePosition(event: any, camera: THREE.PerspectiveCamera) {
  let x = (event.clientX / window.innerWidth) * 2 - 1;//将鼠标点击的x值转换成[-1, 1]
  let y = - (event.clientY / window.innerHeight) * 2 + 1;//将鼠标点击的y值转换成[-1, 1]
  return new THREE.Vector3(x, y, -1).unproject(camera); /* 通过unproject方法，使用所传入的摄像机来反投影（projects）该向量，得到鼠标对应三维空间点 */
}