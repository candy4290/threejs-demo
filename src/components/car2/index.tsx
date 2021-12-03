import { useEffect } from "react"
import * as THREE from 'three';
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { createComposerAndRenderPass, createFxaa } from "../../utils/threejs-util";
import * as dat from 'dat.gui';
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { drawLine, selfDrawLine } from "./three-info";
import './index.less';

/**
 * 路、匝道、渣土车、货车、小轿车、长途客车、l2~l4智能车辆
 *
 * @export
 * @return {*} 
 */
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;
let composer: EffectComposer;
let gui: dat.GUI;
let effectFXAA: ShaderPass;
let carModel: any;
let wheels: any[] = [];
let minx = 0;
let miny = 0;
let minz = 0;
let maxx = 0;
let maxy = 0;
let maxz = 0;
let raycaster: THREE.Raycaster;
const mouse = new THREE.Vector2();
let trace: THREE.Vector3[] = []; /* 轨迹点位 */
let points: THREE.Vector3[] = []; /* 继续射线最新的10个点 */
let catmullRomCurve3: THREE.CatmullRomCurve3;
let catmullRomCurve3Length: number;
let stopContinueControls: dat.GUIController[] = [];
const clock = new THREE.Clock();
export default function Car2() {
    useEffect(() => {
        init();
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('dblclick', dbClick);
            effectFXAA.clear = true;
            scene.traverse((child: any) => {
                if (child.material) {
                  child.material.dispose();
                }
                if (child.geometry) {
                  child.geometry.dispose();
                }
                child = null;
            });
            renderer.forceContextLoss();
            renderer.context = null as any;
            renderer.dispose();
            controls.dispose();
            gui.destroy();
            camera.clear();
            scene.clear();
        }
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

        loadRoad();
        createCar();

        composer = createComposerAndRenderPass(renderer, scene, camera).composer;
        effectFXAA = createFxaa(composer).effectFXAA;

        raycaster = new THREE.Raycaster();
        window.addEventListener( 'mousemove', onMouseMove, false );
        window.addEventListener('dblclick', dbClick);

        render();
        
    }

    function loadRoad() {
        const loader = new GLTFLoader();
        loader.load('/glbs/与道路接轨的桥/scene.gltf', (gltf) => {
            // const temp = gltf.scene.children[0].children[0].children[0].children[0].children[0].children[4];
            const temp = gltf.scene.children[0];
            // 4-黄线 5-桥 6-平地路网
            temp.traverse((object: any) => {
                if (object.isMesh) {
                    object.geometry.computeBoundingBox();
                    const t = object.geometry.boundingBox;
                    if (t.min.x < minx) {
                        minx = t.min.x
                    }
                    if (t.min.y < miny) {
                        miny = t.min.y
                    }
                    if (t.min.z < minz) {
                        minz = t.min.z
                    }
                    if (t.max.x > maxx) {
                        maxx = t.max.x
                    }
                    if (t.max.y > maxy) {
                        maxy = t.max.y
                    }
                    if (t.max.z > maxz) {
                        maxz = t.max.z
                    }
                    object.castShadow = true; /* 物体开启“引起阴影” */
                    object.receiveShadow = true; /* 物体开启“接收阴影” */
                };
            });
            temp.position.y = -5.6;
            console.log({minx, miny, minz}, {maxx, maxy, maxz}, {x: maxx-minx, y: maxy-miny, z: maxz - minz})
            scene.add(temp);

            // drawLine().then(rsp => {catmullRomCurve3 = rsp;catmullRomCurve3Length = catmullRomCurve3.getLength()});
        }, e=> {
            if (e.lengthComputable) {
                console.log(e.loaded, e.total)
            }
        });
    }

    function createCar() {
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xff0000, metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05
        });
        const detailsMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, metalness: 1.0, roughness: 0.5
        });
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, metalness: 0, roughness: 0.1, opacity: 0.8, transparent: true
        });

        // Car
        const shadow = new THREE.TextureLoader().load('/glbs/ferrari_ao.png');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/js/libs/draco/gltf/');

        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        loader.load('/glbs/ferrari.glb', (gltf) => {
            // console.log(gltf)
            carModel = gltf.scene.children[0];
            carModel.traverse((object: any) => {
                if (object.isMesh) {
                    object.userData = {
                        'hasOutlinePass': true,
                    }
                    object.castShadow = true; /* 物体开启“引起阴影” */
                    object.receiveShadow = true; /* 物体开启“接收阴影” */
                };
            });
            carModel.getObjectByName('body').material = bodyMaterial;
            carModel.getObjectByName('rim_fl').material = detailsMaterial;
            carModel.getObjectByName('rim_fr').material = detailsMaterial;
            carModel.getObjectByName('rim_rr').material = detailsMaterial;
            carModel.getObjectByName('rim_rl').material = detailsMaterial;
            carModel.getObjectByName('trim').material = detailsMaterial;
            carModel.getObjectByName('glass').material = glassMaterial;
            carModel.position.set(504,0.2,-14)
            carModel.paused = true;
            carModel.progress = 0;
            wheels.push(
                carModel.getObjectByName('wheel_fl'),
                carModel.getObjectByName('wheel_fr'),
                carModel.getObjectByName('wheel_rl'),
                carModel.getObjectByName('wheel_rr')
            );

            // for (let i = 0; i < wheels.length; i++) { /* 转动车轮 */
            //     if (i === 0 || i === 1) {
            //         wheels[i].rotation.z = Math.PI / 8;
            //     }
            // }

            // shadow
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
                new THREE.MeshBasicMaterial({
                    map: shadow, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true
                })
            );
            mesh.rotation.x = - Math.PI / 2;
            mesh.renderOrder = 2;
            scene.add(carModel);
            // light.target = carModel; /* 平行光现在就可以追踪到目标对像了 */
        });
    }

    function createPanel() {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        dat.GUI.TEXT_OPEN = '打开Controls';

        const axisHelper = new THREE.AxesHelper(650); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */

        gui = new dat.GUI();
        const folder00 = gui.addFolder('车辆状态');
        const folder0 = gui.addFolder('辅助处理');
        const folder = gui.addFolder('后期处理');
        const settings = {
            '清空轨迹': () => {
                trace = [];
                carModel.paused = true;
                carModel.position.set(504,0.2,-14)
            },
            '暂停': () => {
                carModel.paused = true;
            },
            '继续': () => {
                console.log(trace)
                catmullRomCurve3 = selfDrawLine(trace);
                catmullRomCurve3Length = catmullRomCurve3.getLength();
                carModel.paused = false;
                if (carModel.progress >= 1) {
                    carModel.progress = 0;
                }
            },
            '坐标轴': false,
            '抗锯齿': false
        }
        folder00.add(settings, '清空轨迹');
        stopContinueControls.push(folder00.add(settings, '暂停'));
        stopContinueControls.push(folder00.add(settings, '继续'));
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
        stopContinueControls.forEach((control: any) => {
            control.classList1 = control.domElement.parentElement.parentElement.classList;
            control.classList2 = control.domElement.previousElementSibling.classList; /* 相同层级的前一个兄弟元素 */
            control.setDisabled = () => {
                control.classList1.add('no-pointer-events');
                control.classList2.add('control-disabled');
            };
            control.setEnabled = () => {
                control.classList1.remove('no-pointer-events');
                control.classList2.remove('control-disabled');
            };
        })
    }

    /* 更新暂停、继续操作的可用性 */
    function updateCrossFadeControls() {
        if (carModel.paused || carModel.progress >= 1) {
            (stopContinueControls[0] as any).setDisabled();
            (stopContinueControls[1] as any).setEnabled();
        } else {
            (stopContinueControls[0] as any).setEnabled();
            (stopContinueControls[1] as any).setDisabled();
        }
    }
    /* 
    射线一直存在
    双击记录点
    */

    function onMouseMove( event ) {
        // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects( scene.children );
        if (intersects.length > 0) {
            if (points.length > 10) {
                points.shift()
                points.push(intersects[0].point);
            } else {
                points.push(intersects[0].point);
            }
        }
    }

    function dbClick() {
        if (points.length > 0) {
            trace.push(points[points.length - 1])
        }
    }
    
    function render() {
        requestAnimationFrame(render)
        if (carModel && stopContinueControls.length > 0) {
            updateCrossFadeControls();
        }
        const t = clock.getDelta();
        if (catmullRomCurve3 && carModel && carModel.progress < 1 && !carModel.paused) {
            const temp = t * (40 * 1000 / 3600) / catmullRomCurve3Length;

            const time = -performance.now() / 1000;
            for (let i = 0; i < wheels.length; i++) { /* 转动车轮 */
                wheels[i].rotation.x = time * Math.PI;
            }
            carModel.progress += temp;
            // console.log(carModel.progress)
            const point = catmullRomCurve3.getPoint(carModel.progress); /* 也是向量切线的终点坐标 */
            // const tangent = catmullRomCurve3.getTangent(carModel.progress - Math.floor(carModel.progress)).multiplyScalar(10); /* 单位向量切线 */
            // const startPoint = new THREE.Vector3(point.x - tangent.x, point.y - tangent.y, point.z - tangent.z); /* 向量切线的起点坐标 */

            const point1 = catmullRomCurve3.getPoint(carModel.progress - 0.0001);
            console.log(carModel.progress)
            if (point && point.x) {
                carModel.position.copy(point);
                if (carModel.progress < 1) { /* 此判断条件用来确保：车头保持原先的方向 */
                    carModel.lookAt(point1); /* 转弯、掉头动作 */
                }

                // if (settings['相机跟随']) {
                //     camera.position.copy(startPoint).setY(20);
                //     controls.target.copy(point);
                // }
            }
        }
        
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