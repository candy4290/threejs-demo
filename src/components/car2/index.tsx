import { useEffect } from "react"
import * as THREE from 'three';
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { createComposerAndRenderPass, createFxaa } from "../../utils/threejs-util";
import * as dat from 'dat.gui';
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { createCarsBindTrace, createDKC, createLbjn, drawLine, selfDrawLine } from "./three-info";
import './index.less';

/**
 * 路、匝道、渣土车、货车、小轿车、长途客车、l2~l4智能车辆
 *
 * @export
 * @return {*} 
 */
let testCarModels: any[] = [];
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;
let composer: EffectComposer;
let gui: dat.GUI;
let effectFXAA: ShaderPass;
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
let stopContinueControls: dat.GUIController[] = [];
let settings: any = {};
const clock = new THREE.Clock();
const carList: any[] = [];
export default function Car2() {
    useEffect(() => {
        init();
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('dblclick', dbClick);
            window.removeEventListener('resize', onWindowResize);
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

        composer = createComposerAndRenderPass(renderer, scene, camera).composer;
        effectFXAA = createFxaa(composer).effectFXAA;

        raycaster = new THREE.Raycaster();
        window.addEventListener('resize', onWindowResize);

        createCarsBindTrace(scene, carList, testCarModels);

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

    function createPanel() {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        dat.GUI.TEXT_OPEN = '打开Controls';

        const axisHelper = new THREE.AxesHelper(650); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */

        gui = new dat.GUI();
        const folder00 = gui.addFolder('车辆状态');
        const folder0 = gui.addFolder('辅助处理');
        const folder = gui.addFolder('后期处理');
        const folder2 = gui.addFolder('视角');
        const folder3 = gui.addFolder('个人调试');
        settings = {
            '暂停': () => {
                carList.forEach(item => {
                    item.paused = true;
                })
            },
            '相机跟随': '不跟随',
            '继续': () => {
                carList.forEach(item => {
                    item.paused = false;
                    if (item.progress >= 1) {
                        item.progress = 0;
                    }
                })
            },
            '坐标轴': false,
            '抗锯齿': false,
            '开启射线': false,
            '启': () => {
                testCarModels[0].paused = false;
                testCarModels[0].catmullRomCurve3 = selfDrawLine(trace);
                testCarModels[0].catmullRomCurve3Length = testCarModels[0].catmullRomCurve3.getLength();
                testCarModels[0].progress = 0;
            },
            '停': () => {
                testCarModels[0].paused = true;
            },
            '视角跟随': false,
            '打印点位': () => {
                console.log(trace);
            },
            '清空点位': () => {
                testCarModels[0].paused = true;
                testCarModels[0].position.set(null);
                points = [];
                trace = [];
            }
        }
        // folder00.add(settings, '清空轨迹');
        folder3.add(settings, '开启射线').onChange(e => {
            if (e) {
                window.addEventListener( 'mousemove', onMouseMove, false );
                window.addEventListener('dblclick', dbClick);
            } else {
                window.removeEventListener( 'mousemove', onMouseMove );
                window.removeEventListener('dblclick', dbClick);
            }
        });
        stopContinueControls.push(folder00.add(settings, '暂停'));
        stopContinueControls.push(folder00.add(settings, '继续'));
        stopContinueControls.push(folder3.add(settings, '启'));
        stopContinueControls.push(folder3.add(settings, '停'));
        folder3.add(settings, '视角跟随').onChange(e => {
            testCarModels[0].follow = e;
        });
        folder3.add(settings, '打印点位');
        folder3.add(settings, '清空点位');
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
        });
        folder2.add(settings, '相机跟随', ['不跟随', '红车', '黄车', '黑车', '白车', '绿车', '蓝车', '粉色']).onChange(e => {
            const temp = {
                '不跟随': '',
                '红车': 'red',
                '黄车': 'yellow',
                '黑车': 'black',
                '白车': 'white',
                '绿车': 'green',
                '蓝车': 'blue',
                '粉色': 'pink'
            };
            carList.forEach(item => {
                item.follow = temp[e] === item.color;
            })
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
       const flag = carList.filter(item => (item.paused || item.progress > 1)).length > 0;
       if (flag) {
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

    function onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        composer?.setSize(width, height);
    }

    
    function render() {
        requestAnimationFrame(render)
        if (stopContinueControls.length > 0) {
            updateCrossFadeControls();
        }
        const t = clock.getDelta();
        carList.forEach(item => {
            if (item.progress < 1 && !item.paused) {
                const temp = t * (80 * 1000 / 3600) / item.catmullRomCurve3Length;
                const time = -performance.now() / 1000;
                for (let i = 0; i < item.wheels.length; i++) { /* 转动车轮 */
                    item.wheels[i].rotation.x = time * Math.PI;
                }
                item.progress += temp;
                const point = item.catmullRomCurve3.getPoint(item.progress); /* 也是向量切线的终点坐标 */
                const tangent = item.catmullRomCurve3.getTangent(item.progress - Math.floor(item.progress)).multiplyScalar(10); /* 单位向量切线 */
                const startPoint = new THREE.Vector3(point.x - tangent.x, point.y - tangent.y, point.z - tangent.z); /* 向量切线的起点坐标 */
    
                const point1 = item.catmullRomCurve3.getPoint(item.progress - 0.0001);
                if (point && point.x) {
                    item.position.copy(point);
                    if (item.progress < 1) { /* 此判断条件用来确保：车头保持原先的方向 */
                        item.lookAt(point1); /* 转弯、掉头动作 */
                        if (item.follow) {
                            camera.position.copy(startPoint).setY(startPoint.y + 2);
                            controls.target.copy(point);
                        }
                    }
                }
            } else if (item.progress >= 1 && !item.paused) {
                item.progress = 0;
            }

        });
        if (testCarModels.length > 0 && !testCarModels[0].paused && testCarModels[0].catmullRomCurve3) {
            const temp = t * (80 * 1000 / 3600) / testCarModels[0].catmullRomCurve3Length;
            const time = -performance.now() / 1000;
            for (let i = 0; i < testCarModels[0].wheels.length; i++) { /* 转动车轮 */
                testCarModels[0].wheels[i].rotation.x = time * Math.PI;
            }
            testCarModels[0].progress += temp;
            const point = testCarModels[0].catmullRomCurve3.getPoint(testCarModels[0].progress); /* 也是向量切线的终点坐标 */
            const tangent = testCarModels[0].catmullRomCurve3.getTangent(testCarModels[0].progress - Math.floor(testCarModels[0].progress)).multiplyScalar(10); /* 单位向量切线 */
            const startPoint = new THREE.Vector3(point.x - tangent.x, point.y - tangent.y, point.z - tangent.z); /* 向量切线的起点坐标 */

            const point1 = testCarModels[0].catmullRomCurve3.getPoint(testCarModels[0].progress - 0.0001);
            if (point && point.x) {
                testCarModels[0].position.copy(point);
                if (testCarModels[0].progress < 1) { /* 此判断条件用来确保：车头保持原先的方向 */
                    testCarModels[0].lookAt(point1); /* 转弯、掉头动作 */
                    if (testCarModels[0].follow) {
                        camera.position.copy(startPoint).setY(startPoint.y + 2);
                        controls.target.copy(point);
                    }
                } else {
                    testCarModels[0].paused = true;
                }
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