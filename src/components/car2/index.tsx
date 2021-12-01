import { useEffect } from "react"
import * as THREE from 'three';
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { createComposerAndRenderPass, createFxaa } from "../../utils/threejs-util";
import * as dat from 'dat.gui';
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

/**
 * 路、匝道、渣土车、货车、小轿车、长途客车、l2~l4智能车辆
 *
 * @export
 * @return {*} 
 */
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: any;
let composer: EffectComposer;
let gui: dat.GUI;
let effectFXAA: ShaderPass;
export default function Car2() {
    useEffect(() => {
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 5000);
        camera.position.set(200,200,200);
        renderer = new THREE.WebGLRenderer({canvas, antialias: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true; /* 渲染器开启阴影渲染 */
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.85; /* 色调映射的曝光级别 */

        controls = new MapControls(camera, renderer.domElement);
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2.01;
        controls.screenSpacePanning = false;
        controls.target.set(2, 0, 0);

        const light = new THREE.DirectionalLight(0xffffff);
        light.position.set(200, 200, 200);
        light.castShadow = true; /* 灯光开启“引起阴影” */
        scene.add(light);



        const light2 = new THREE.AmbientLight('#ffffff');
        scene.add(light2);

        createPanel();

        const loader = new GLTFLoader();
        loader.load('/glbs/与道路接轨的桥/scene.gltf', (gltf) => {
            const temp = gltf.scene.children[0];
            temp.traverse((object: any) => {
                if (object.isMesh) {
                    object.castShadow = true; /* 物体开启“引起阴影” */
                    object.receiveShadow = true; /* 物体开启“接收阴影” */
                };
            });
            temp.position.y = -5.6;
            console.log(temp);
            scene.add(temp);
        }, e=> {
            if (e.lengthComputable) {
                console.log(e.loaded, e.total)
            }
        });

        composer = createComposerAndRenderPass(renderer, scene, camera).composer;
        effectFXAA = createFxaa(composer).effectFXAA;
        
        render();
        
    }

    function createPanel() {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        dat.GUI.TEXT_OPEN = '打开Controls';

        const axisHelper = new THREE.AxesHelper(50);

        gui = new dat.GUI();
        const folder0 = gui.addFolder('辅助处理');
        const folder = gui.addFolder('后期处理');
        const settings = {
            '坐标轴': false,
            '抗锯齿': false
        }
        folder0.add(settings, '坐标轴').onChange(e => {
            if (e) {
                scene.add(axisHelper);
            } else {
                scene.remove(axisHelper);
            }
        })
        folder.add(settings, '抗锯齿').onChange(e => {
            if (e) {
                effectFXAA = createFxaa(composer).effectFXAA;
            } else {
                composer.removePass(effectFXAA);
            }
        })
    }
    
    function render() {
        requestAnimationFrame(render)
        controls.update();
        if (composer && composer.passes.length > 1) {
            composer.readBuffer.texture.encoding = renderer.outputEncoding;
            composer.render();
        } else {
            renderer.render(scene, camera)
        }
    }
    return (
        <canvas id="three"></canvas>
    )
}