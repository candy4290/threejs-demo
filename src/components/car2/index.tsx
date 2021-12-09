import { useEffect } from "react"
import * as THREE from 'three';
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { createComposerAndRenderPass, createFxaa } from "../../utils/threejs-util";
import * as dat from 'dat.gui';
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { createCarsBindTrace, flyTo2, loadRoad, selfDrawLine } from "./three-info";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import './index.less';
import TWEEN from '@tweenjs/tween.js'


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
let labelRenderer: CSS2DRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

let controls: MapControls;
let composer: EffectComposer;
let scene2: THREE.Scene = new THREE.Scene();
let renderer2: CSS3DRenderer = new CSS3DRenderer();
renderer2.setSize(window.innerWidth, window.innerHeight);
renderer2.domElement.style.position = 'absolute';
renderer2.domElement.style.top = '0px';
document.body.appendChild(renderer2.domElement);

let gui: dat.GUI;
let effectFXAA: ShaderPass;
let raycaster: THREE.Raycaster;
const mouse = new THREE.Vector2();
let trace: THREE.Vector3[] = []; /* 轨迹点位 */
let points: THREE.Vector3[] = []; /* 继续射线最新的10个点 */
let stopContinueControls: dat.GUIController[] = [];
let settings: any = {};
const clock = new THREE.Clock();
const carList: any[] = [];
let dingPaiLable: CSS2DObject;
let flyIndex = 0;
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
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
        camera.position.set(200, 200, 200);
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true; /* 渲染器开启阴影渲染 */
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.85; /* 色调映射的曝光级别 */

        const light = new THREE.DirectionalLight(0xffffff);
        light.position.set(200, 200, 200);
        light.castShadow = true; /* 灯光开启“引起阴影” */
        scene.add(light);

        const light2 = new THREE.AmbientLight('#ffffff');
        scene.add(light2);

        createPanel();

        loadRoad(scene);

        composer = createComposerAndRenderPass(renderer, scene, camera).composer;
        effectFXAA = createFxaa(composer).effectFXAA;

        raycaster = new THREE.Raycaster();
        window.addEventListener('resize', onWindowResize);

        createCarsBindTrace(scene, carList, testCarModels);

        createControls();

        /* 获取射线到平面的距离 */
        // const t = new THREE.Ray(new THREE.Vector3(0,100,0), new THREE.Vector3(0,-1,0))
        // const tt = t.distanceToPlane(new THREE.Plane(new THREE.Vector3(0,1,0), 0));
        // console.log(tt);

        render();

    }

    function createControls() {
        controls = new MapControls(camera, renderer2?.domElement);
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2.01;
        controls.screenSpacePanning = false;
        controls.target.set(2, 0, 0);
    }

    /* 创建2d展示 */
    function create2ds() {
        const dingPaiDiv = document.createElement('div');
        dingPaiDiv.className = 'box2';
        dingPaiDiv.innerHTML = `
            <div class="ys-block">
                <div class="ys-con">
                    西部世界
                </div>
            </div>
        `

        dingPaiLable = new CSS2DObject(dingPaiDiv);


        dingPaiLable.position.set(100, 50, 100);
        scene.add(dingPaiLable);
    }

    /* 创建3d顶牌 */
    function create3ds() {
        const dingPaiDiv3 = document.createElement('div');
        dingPaiDiv3.className = 'box2';
        dingPaiDiv3.innerHTML = `
            <div class="ys-block">
                <div class="ys-con">
                    西部世界
                </div>
            </div>
        `
        const dingPaiLable3 = new CSS3DObject(dingPaiDiv3);
        dingPaiLable3.position.set(-50, 50, -214);
        dingPaiLable3.scale.set(0.5, 0.5, 0.5)
        scene2.add(dingPaiLable3);
    }

    function createPanel() {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        dat.GUI.TEXT_OPEN = '打开Controls';

        const axisHelper = new THREE.AxesHelper(650); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */

        gui = new dat.GUI({width: 260});
        const folder00 = gui.addFolder('车辆状态');
        const folder2 = gui.addFolder('视角');
        const folder4 = gui.addFolder('顶牌展示');
        const folder = gui.addFolder('后期处理');
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
            },
            '2d顶牌': false,
            '3d顶牌': false,
            'camera-x': 200,
            'camera-y': 200,
            'camera-z': 200,
            '前往下一个巡逻点': () => {
                const list = [
                    [[104.45594331446466,11.108265937132753,19.40112869264901], [155.19527513615836,6.512210056323601e-17,-123.40401977071092]],
                    [[534.3,5.6,-6.8], [400, 3.2, -49.6]],
                    [[81.5,11.4,-227.7], [74.9,1.09, -168.81]],
                    [[-591.98, 15.44,200.02], [-495.06, 1.105, 146.67]],
                    [[-13.27,23.86,-76.77], [44.93,9.27,-85.74]],
                    [[200,200,200], [2,0,0]]
                ];
                flyTo2(controls, {
                    position: list[flyIndex][0],
                    controls: list[flyIndex][1],
                    duration:1000,
                    done: () => {
                        if (flyIndex === list.length - 1) {
                            flyIndex = 0;
                        } else {
                            flyIndex++
                        }
                    }
                }, camera)
            },
            '相机/控制器位置': () => {
                const t = camera.position;
                const t2 = controls.target;
                console.log([[t.x, t.y, t.z], [t2.x, t2.y, t2.z]])
            },
            '控制器位置': () => {
            }
        }
        folder4.add(settings, '2d顶牌').onChange(e => {
            if (e) {
                create2ds();
            } else {
                scene.remove(dingPaiLable);
            }
        })
        folder4.add(settings, '3d顶牌').onChange(e => {
            if (e) {
                create3ds();
            } else {
                scene2.clear()
            }
        })
        // folder00.add(settings, '清空轨迹');
        folder3.add(settings, '开启射线').onChange(e => {
            if (e) {
                window.addEventListener('mousemove', onMouseMove, false);
                window.addEventListener('dblclick', dbClick);
            } else {
                window.removeEventListener('mousemove', onMouseMove);
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
        folder3.add(settings, 'camera-x').onChange(e => {
            camera.position.setX(e);
        });
        folder3.add(settings, 'camera-y').onChange(e => {
            camera.position.setY(e);
        });
        folder3.add(settings, 'camera-z').onChange(e => {
            camera.position.setZ(e);
        });
        folder3.add(settings, '相机/控制器位置');
        folder3.add(settings, '坐标轴').onChange(e => {
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
        folder2.add(settings, '前往下一个巡逻点');
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
            if (e === '不跟随') {
                // controls.reset();
                flyTo2(controls, {
                    position: [200,200,200],
                    duration:500,
                    controls: [0,0,0],
                    done: () => {
                       console.log('down')
                    }
                }, camera)
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

    function onMouseMove(event) {
        // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(scene.children);
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
        // labelRenderer && labelRenderer.setSize(window.innerWidth, window.innerHeight);
        // renderer2 && renderer2.setSize(window.innerWidth, window.innerHeight);
        composer?.setSize(width, height);
    }


    function render() {
        requestAnimationFrame(render)
        TWEEN.update();
        if (stopContinueControls.length > 0) {
            updateCrossFadeControls();
        }
        const t = clock.getDelta();
        carList.forEach(item => {
            if (item.progress < 1 && !item.paused) {
                const temp = t * (item.speed * 1000 / 3600) / item.catmullRomCurve3Length;
                const time = -performance.now() / 1000;
                for (let i = 0; i < item.wheels.length; i++) { /* 转动车轮 */
                    item.wheels[i].rotation.x = time * Math.PI;
                }
                item.progress += temp;
                if (item.progress >= 1) {
                    item.progress = 1;
                    item.speed = (Math.floor(Math.random() * 60) + 60);
                }
                let point = item.catmullRomCurve3.getPointAt(item.progress); /* 也是向量切线的终点坐标 */
                
                const tangent = item.catmullRomCurve3.getTangentAt(item.progress - Math.floor(item.progress)).multiplyScalar(10); /* 单位向量切线 */
                const startPoint = new THREE.Vector3(point.x - tangent.x, point.y - tangent.y, point.z - tangent.z); /* 向量切线的起点坐标 */

                // if (item.color === 'red') {
                //     const ray = new THREE.Raycaster(new THREE.Vector3(point.x, point.y + 2, point.z), new THREE.Vector3(0,-1,0)); 
                //     const tt = ray.intersectObjects(scene.children);
                //     if (tt.length > 0) {
                //         // console.log(point, tt[0].point)
                //         point = tt[0].point;
                //     }
                // }

                const point1 = item.catmullRomCurve3.getPointAt(item.progress - 0.0001);
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
            const point = testCarModels[0].catmullRomCurve3.getPointAt(testCarModels[0].progress); /* 也是向量切线的终点坐标 */
            const tangent = testCarModels[0].catmullRomCurve3.getTangentAt(testCarModels[0].progress - Math.floor(testCarModels[0].progress)).multiplyScalar(10); /* 单位向量切线 */
            const startPoint = new THREE.Vector3(point.x - tangent.x, point.y - tangent.y, point.z - tangent.z); /* 向量切线的起点坐标 */

            const point1 = testCarModels[0].catmullRomCurve3.getPointAt(testCarModels[0].progress - 0.0001);
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
        labelRenderer.render(scene, camera);
        renderer2.render(scene2, camera);
    }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}