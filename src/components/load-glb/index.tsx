import { useEffect } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from 'three';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * glb模型加载&动画
 *
 * @export
 * @return {*} 
 */
export default function LoadGlb() {

  useEffect(() => {
    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadModel() {
    let mixer: THREE.AnimationMixer;

    const clock = new THREE.Clock();
    const canvas = document.querySelector('#three') as HTMLCanvasElement;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); /* 创建渲染器 */
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding; /* Defines the output encoding of the renderer;使用颜色贴图 */

    const pmremGenerator = new THREE.PMREMGenerator(renderer); /* 预过滤的Mipmapped辐射环境贴图 */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe3dd); /* 预设场景的背景色 */
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture; /* 给场景添加环境光效果 */

    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 100); /* 相机 */
    camera.position.set(5, 2, 8);

    const controls = new OrbitControls(camera, renderer.domElement); /* 相机控件-对三维场景进行缩放、平移、旋转。本质上不是改变场景，而是相机的参数。 */
    controls.target.set(0, 0.5, 0);
    controls.update(); /* must be called after any manual changes to the camera's transform */
    controls.enablePan = false; /* 禁止右键拖拽 */
    controls.enableDamping = true; /* 阻尼效果 */

    const dracoLoader = new DRACOLoader(); /* draco压缩算法 */
    dracoLoader.setDecoderPath('/js/libs/draco/gltf/'); // Specify path to a folder containing WASM/JS decoding libraries.

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load('/glbs/tokyo/LittlestTokyo.glb', function (gltf) {
      console.log(gltf)
      const model = gltf.scene;
      model.position.set(1, 1, 0);
      model.scale.set(0.01, 0.01, 0.01);
      scene.add(model);

      mixer = new THREE.AnimationMixer(model); /* 变形动画 */
      // mixer.clipAction(gltf.animations[0]).play(); /* clipAction方法可以控制执行动画的实例 */

      animate();
    }, xhr => {
      // console.log(xhr)
      // console.log(xhr.loaded/xhr.total)
    }, function (e) {
      console.error(e);
    });


    window.onresize = function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    function animate() {
      requestAnimationFrame(animate); /* 周期性执行渲染函数 */
      const delta = clock.getDelta(); /* 获取前后两次执行该方法的时间间隔 */
      // console.log('两次渲染时间间隔：' + delta)
      mixer.update(delta); /* 更新动画 */
      controls.update(); /* 设置enableDamping、autoRotate 时需要调用 */
      renderer.render(scene, camera); /* 使用渲染器和相机进行渲染；渲染出来一帧图像 */

    }
  }

  return (
    <canvas id="three"></canvas>
  );
}