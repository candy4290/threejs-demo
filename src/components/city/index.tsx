import { useEffect } from "react";
import * as THREE from 'three';
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Water } from 'three/examples/jsm/objects/Water';
import { addSnow, createCarsBindTrace, createLightLine, flyObjWithPositionList, forMaterial, surroundLineGeometry } from './three-info';
import Shader from './shader';
import {
    Radar,
    Wall,
    Fly,
    WallBox
} from './effect';
import * as dat from 'dat.gui';
import { flyTo2 } from "./three-info";
import TWEEN from '@tweenjs/tween.js'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import './index.less';
import PositionImg from '../../assets/images/3d/position.png';

/**
 * 智慧城市光影效果
 * 魔视主题色---#11A4A1、#1485A6、#00457D
 * @export
 * @return {*} 
 */
const group = new TWEEN.Group(); /* fly的group */

let snowInfo; 

let labelRenderer: CSS2DRenderer;
let cSS2DObject2: CSS2DObject[] = [];
let new2dObj: {[key: string]: CSS2DObject} = {};

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;
let mixer: THREE.AnimationMixer; 
let texture: THREE.Texture;
let clock = new THREE.Clock();
let flymodel: THREE.Object3D; /* 无人机 */
let destory;
let rafId;
let water: Water;
let gui: dat.GUI;
let settings: any = {};
let wallBox: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [];
let radar: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [];
let wall: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [];
let fly: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [];
const boWen = { /* 从中心往外波纹扩散 */
    value: new THREE.Vector3(
        1, // 0 1开关
        20, // 范围
        600 // 速度
    )
};; /* 波纹扩散效果 */
const saoGuang = { /* 建筑从下往上的光效 */
    value: new THREE.Vector3(
        1, // 0 1开关
        10, // 范围
        60 // 速度
    )
}
const uSpeed = { /* 矩形横扫线的透明度 */
    value: 0.2
};
const uRange = {
    value: 200
}

let isStart = false;
const time = {
    value: 0
};
const StartTime = {
    value: 0
};
let surroundLineMaterial: THREE.ShaderMaterial;

const wallBoxData = [{
    positions: [[327.93,18.61,655.42],[354.63,18.61,492.90],[484.55,18.61,524.59],[449.01,18.61,686.09],[327.93,18.61,655.42]],
    height: 50,
    color: '#0099FF',
    opacity: 1,
    num: 5,
    hiz: 0.15,
}]
const radarData = [{
    position: {
        x: 666,
        y: 22,
        z: 0
    },
    radius: 150,
    color: '#ff0062',
    opacity: 0.5,
    speed: 2
}, {
    position: {
        x: -666,
        y: 25,
        z: 202
    },
    radius: 320,
    color: '#efad35',
    opacity: 0.6,
    speed: 1
}];
const wallData = [{
    position: {
        x: -150,
        y: 15,
        z: 100
    },
    speed: 0.5,
    color: '#efad35',
    opacity: 0.6,
    radius: 420,
    height: 120,
    renderOrder: 5
}]
const flyData = [{
    source: {
        x: -150,
        y: 15,
        z: 100
    },
    target: {
        x: -666,
        y: 25,
        z: 202
    },
    range: 120,
    height: 100,
    color: '#efad35',
    speed: 1,
    size: 30
}, {
    source: {
        x: -150,
        y: 15,
        z: 100
    },
    target: {
        x: 666,
        y: 22,
        z: 0
    },
    height: 300,
    range: 150,
    color: '#ff0000',
    speed: 1,
    size: 40
}];

let raycaster: THREE.Raycaster;
const mouse = new THREE.Vector2();
let trace: THREE.Vector3[] = []; /* 轨迹点位 */
const carList: any[] = [];
let testCarModels: any[] = [];

export default function City() {

    useEffect(() => {
        // document.body.style.cursor = "url('https://raw.githubusercontent.com/chenglou/react-motion/master/demos/demo8-draggable-list/cursor.png') 39 39, auto"
        init();
        return () => {
            gui.destroy();
            window.removeEventListener('resize', onWindowResize);
            destory = true;
            scene.traverse((child: any) => {
                if (child.material) {
                    child.material.dispose();
                }
                if (child.geometry) {
                    child.geometry.dispose();
                }
                child = null;
            });
            renderer.dispose();
            controls.dispose();
            camera.clear();
            scene.clear();
            // renderer.forceContextLoss();
            renderer = null as any;
            camera = null as any;
            scene = null as any;
            controls = null as any;
            gui = null as any;
            radar = null as any;
            wall = null as any;
            fly = null as any;
            water = null as any;
            cSS2DObject2 = null as any;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(1200, 700, 121);
        scene.add(camera);

        const light = new THREE.AmbientLight(0xadadad); /* 环境光 */
        scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); /* 平行光源 */
        directionalLight.position.set(100, 100, 0);
        scene.add(directionalLight);

        renderer = new THREE.WebGLRenderer({
            canvas, antialias: true,
            alpha: true /* canvas是否包含alpha (透明度)。默认为 false */
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(new THREE.Color('#32373E'), 1);

        controls = new MapControls(camera, renderer.domElement);
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2.02;
        controls.screenSpacePanning = false;
        controls.target.set(2, 0, 0);
        loadCity();
        load2DBoard();
        addVideo();
        
        createPanel();
        
        // scene.add(new THREE.AxesHelper(1660))
        /* 亮的轨迹线条 */
        texture = createLightLine([
            {
                "x": 802.3299904494879,
                "y": 19.068050175905103,
                "z": 592.01164608935
            },
            {
                "x": 762.3812541386974,
                "y": 19.068050175905103,
                "z": 588.6219318478661
            },
            {
                "x": 212.6744889891521,
                "y": 19.068050175905135,
                "z": 442.46940951320863
            },
            {
                "x": -73.43457228885484,
                "y": 19.068050175905142,
                "z": 410.78540672854035
            },
            {
                "x": -217.3569209044227,
                "y": 19.068050175905142,
                "z": 403.8402612615073
            },
            {
                "x": -293.4935704052756,
                "y": 19.079523980617438,
                "z": 403.90291874080845
            },
            {
                "x": -336.60063378316784,
                "y": 19.079523980617495,
                "z": 406.3164539934255
            },
            {
                "x": -401.95896358305777,
                "y": 24.999999999999954,
                "z": 403.287424706611
            },
            {
                "x": -619.8293525260625,
                "y": 25.000000000000018,
                "z": 380.2697164886164
            },
            {
                "x": -823.6070186623097,
                "y": 24.999999999999964,
                "z": 362.46967760421717
            },
            {
                "x": -869.7286494702976,
                "y": 24.999999999999964,
                "z": 360.4253454753446
            },
            {
                "x": -905.9031173189951,
                "y": 24.999999999999908,
                "z": 368.9510160542171
            },
            {
                "x": -942.5975268080412,
                "y": 24.99999999999996,
                "z": 372.49738076684383
            },
            {
                "x": -1070.3638281944845,
                "y": 19.068050175905153,
                "z": 360.62147159221206
            }
        ].map(item => [item.x, item.y, item.z]), scene);

        raycaster = new THREE.Raycaster();

        window.addEventListener('resize', onWindowResize);

        render();
    }

    function loop() { /* 无人机巡游 */
        flyObjWithPositionList(flymodel, [[249,80,167],[238,80,-56],[-11,80,-377],[-264,80,-323],[-24,80,699]], loop)
    }

    function loadFlyingDrone() {
        /* 加载无人机 */
        const loader = new GLTFLoader();
        loader.load('/glbs/flying_drone/scene.gltf', (gltf) => {
            flymodel = gltf.scene;
            flymodel.scale.set(10,10,10)
            flymodel.position.set(18, 80, 700)
            mixer = new THREE.AnimationMixer( flymodel );
            mixer.clipAction( gltf.animations[ 0 ] ).play();
            scene.add(flymodel);
            /* -#11A4A1、#1485A6、#00457D */
            const pointLight = new THREE.PointLight('#11A4A1', 10, 100);
            flymodel.add(pointLight)
            loop();
        });
    }

    /* 添加视频 */
    function addVideo() {
        const video = document.getElementById('video') as HTMLVideoElement;
        document.addEventListener('click', () => {
            video.play();
        });
        const texture = new THREE.VideoTexture(video);
        const gemo = new THREE.PlaneGeometry(53.90,98.77);
        const material = new THREE.MeshLambertMaterial({
            map: texture, color: 0xffffff
        });
        const mesh = new THREE.Mesh(gemo, material);
        mesh.position.set(-1075.93,68.8, 1159);
        mesh.rotateY(0.35 + Math.PI);
        scene.add(mesh);
    }

    function load2DBoard() {
        /* 精灵材质-始终面向摄像机 */
        // const map = new THREE.TextureLoader().load( "/textures/dt.png" );
        // const material = new THREE.SpriteMaterial( { map: map } );
        // const sprite = new THREE.Sprite( material );
        // sprite.scale.set(10,10,10);
        // sprite.position.set(18, 80, 700)
        // scene.add( sprite );

        labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        document.querySelector('#parent')?.appendChild(labelRenderer.domElement);

        const list = [
            {name: '东方明珠', position: [-530.58, 408.97, 1347.14], target: [[-760.00,367.15,1907.78],[118.55,-1.73,-348.13]]},
            {name: '世贸大厦', position: [-286.36, 296.73, -634.51], target: [[-246.55,497.09,-1330.34],[-478.58,-1.73,930.26]]},
            {name: '虚位以待', position: [-1089.46, 138.08, 1164.64], target: [[-1239.40,54.32,664.66],[-935.71,-1.27,1351.23]]},
        ]
        const createLabel = (item: {name: string, position: [number,number,number], target: any}) => {
            const dingPaiDiv = document.createElement('div');
            dingPaiDiv.className = 'box2';
            dingPaiDiv.innerHTML = `
                <div class="box2-block">
                    <div class="box2-block-content">
                        <p>${item.name}</p>
                        <img src=${PositionImg} id="position-img" target="${JSON.stringify(item.target)}" />
                    </div>
                </div>
            `;
            // const img = dingPaiDiv.children[0].children[0].children[1];
            dingPaiDiv.addEventListener('click', e => {
                if ((e.target as HTMLElement).nodeName === 'IMG') {
                    const target = (e.target as HTMLElement).getAttribute('target');
                    if (target) {
                        const temp = JSON.parse(target);
                        flyTo2(controls, {
                            position: temp[0],
                            controls: temp[1]
                        }, camera, group);
                    }
                }
            })
            const dingPaiLable = new CSS2DObject(dingPaiDiv);
            dingPaiLable.position.set(...item.position);
            cSS2DObject2.push(dingPaiLable);
            scene.add(dingPaiLable);
        }
        list.forEach((item: any) => {
            createLabel(item)
        });
    }

    /* 添加2d顶牌 */
    function add2DLabel(point: THREE.Vector3, mesh: THREE.Mesh) {
        if (new2dObj[mesh.uuid]) {
            scene.remove(new2dObj[mesh.uuid]);
            delete new2dObj[mesh.uuid];
            const temp = document.getElementById(mesh.uuid);
            if (temp) {
                temp.remove()
            }
            return;
        }
        const createLabel = (item: {name: string, position: [number,number,number]}) => {
            const dingPaiDiv = document.createElement('div');
            dingPaiDiv.id = mesh.uuid;
            dingPaiDiv.className = 'box2';
            dingPaiDiv.innerHTML = `
                <div class="box2-block">
                    <div class="box2-block-content">
                        <p>${item.name}</p>
                    </div>
                </div>
            `;
            const dingPaiLable = new CSS2DObject(dingPaiDiv);
            dingPaiLable.position.set(item.position[0], item.position[1], item.position[2]);
            new2dObj[mesh.uuid] = dingPaiLable;
            scene.add(dingPaiLable);
        }
        createLabel({name: '不知名建筑', position: [point.x, point.y, point.z]});
    }

    function onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        labelRenderer?.setSize(width, height);
    }

    /* 创建GUI */
    function createPanel() {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        dat.GUI.TEXT_OPEN = '打开Controls';
        gui = new dat.GUI();
        const folder = gui.addFolder('特效');
        const folder1 = gui.addFolder('视角');
        const folder2 = gui.addFolder('个人调试');
        settings = {
            '开始巡逻': () => {
                flyTo2(controls, {
                    position: [1944,36,420],
                    controls: [-379,4.68,351.86],
                    duration:1000,
                    done: () => {
                        flyTo2(controls, {
                            position: [1909,1241,434],
                            controls: [-501,-3,363],
                            duration:1000,
                            done: () => {
                                flyTo2(controls, {
                                    position: [-259,1470,-1763],
                                    controls: [-418,-3,511],
                                    duration:1000,
                                    done: () => {
                                        flyTo2(controls, {
                                            position: [-2137,547,240],
                                            controls: [500,-5,567],
                                            duration:1000,
                                            done: () => {
                                                flyTo2(controls, {
                                                    position: [-1537,819,2361],
                                                    controls: [257,-5,499],
                                                    duration:1000,
                                                    done: () => {
                                                        flyTo2(controls, {
                                                            position: [1200,700,121],
                                                            controls: [2,0,0],
                                                            duration:1000,
                                                            done: () => {
                                                                
                                                            }
                                                        }, camera, group, 1000)
                                                    }
                                                }, camera, group, 1000)
                                            }
                                        }, camera, group, 1000)
                                    }
                                }, camera, group, 1000)
                            }
                        }, camera, group, 1000)
                    }
                }, camera, group)
            },
            '下雪': false,
            '顶牌': false,
            '车流': false,
            '无人机': false,
            '河流': false,
            '电子围栏': true,
            '雷达扫描': true,
            '建筑扫光': true,
            '投递飞线': true,
            '光墙': true,
            '波纹扩散': true,
            '横扫光线': true,
            'x': -1074.93,
            'y': 71.12,
            'z': 1159.27,
            'rotate': 0,
            '开启射线': false,
            '打印点位': () => {
                console.log(trace);
            },
            '清空点位': () => {
                trace = [];
            },
            '相机/控制器位置': () => {
                const t = camera.position;
                const t2 = controls.target;
                console.log([[t.x, t.y, t.z], [t2.x, t2.y, t2.z]])
            },
            '相机跟随': '不跟随',
        }
        folder.add(settings, '开始巡逻');
        folder.add(settings, '下雪').onChange(e => {
            if (e) {
                if (snowInfo) {
                    scene.add(snowInfo.points);
                } else {
                    addSnow(scene, (points, animate) => {
                        snowInfo = {
                            points,animate
                        }
                    });
                }
            } else {
                scene.remove(snowInfo.points);
            }
        });
        folder.add(settings, '顶牌').onChange(e => {
            if (e) {
                cSS2DObject2.forEach(item => {
                    scene.add(item);
                });
                Object.keys(new2dObj).forEach(key => {
                    scene.add(new2dObj[key]);
                })
            } else {
                cSS2DObject2.forEach(item => {
                    scene.remove(item);
                });
                Object.keys(new2dObj).forEach(key => {
                    scene.remove(new2dObj[key]);
                })
            }
        });
        folder.add(settings, '车流').onChange(e => {
            if (e) {
                if (carList.length === 0) {
                    createCarsBindTrace(scene, carList, testCarModels);
                } else {
                    carList.forEach(item => scene.add(item));
                }
            } else {
                carList.forEach(item => scene.remove(item));
            }
        })
        folder.add(settings, '无人机').onChange(e => {
            if (e) {
                if (!flymodel) {
                    loadFlyingDrone()
                } else {
                    scene.add(flymodel);
                    loop();
                }
            } else {
                scene.remove(flymodel);
                TWEEN.removeAll();
            }
        })
        folder.open();
        folder.add(settings, '电子围栏').onChange(e => {
            if (e) {
                wallBox.forEach(item => {
                    scene.add(item);
                })
            } else {
                wallBox.forEach(item => {
                    scene.remove(item);
                })
            }
        })
        folder.add(settings, '河流').onChange(e => {
            if (e) {
                if (!water) {
                    setRiver();
                }
                scene.add(water);
            } else {
                scene.remove(water);
            }
        })
        folder.add(settings, '横扫光线').onChange(e => {
            uSpeed.value = e ? 0.2 : 0;
            uRange.value = e ? 200 : 0;
        })
        folder.add(settings, '波纹扩散').onChange(e => {
            boWen.value.setX(+e);
        })
        folder.add(settings, '建筑扫光').onChange(e => {
            saoGuang.value.setX(+e);
        })
        folder.add(settings, '雷达扫描').onChange(e => {
            if (e) {
                radar.forEach(item => {
                    scene.add(item);
                })
            } else {
                radar.forEach(item => {
                    scene.remove(item);
                })
            }
        })
        folder.add(settings, '投递飞线').onChange(e => {
            if (e) {
                fly.forEach(item => {
                    scene.add(item);
                })
            } else {
                fly.forEach(item => {
                    scene.remove(item);
                })
            }
        })
        folder.add(settings, '光墙').onChange(e => {
            if (e) {
                wall.forEach(item => {
                    scene.add(item);
                })
            } else {
                wall.forEach(item => {
                    scene.remove(item);
                })
            }
        })

        // folder1.add(settings, '前往下一个巡逻点');
        folder1.add(settings, '相机跟随', ['不跟随', '红车', '黄车', '黑车', '白车', '绿车', '蓝车', '粉色']).onChange(e => {
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
                    position: [-10,839,-1927],
                    duration:500,
                    controls: [-484,-2.4,448],
                    done: () => {
                       console.log('down')
                    }
                }, camera, group);
            }
        });
        folder1.open();
        // folder2.add(settings, 'x', -3000, 3000,0.01).onChange(e => {
        //     mesh.position.setX(e);
        // })
        // folder2.add(settings, 'y', -3000, 3000,0.01).onChange(e => {
        //     mesh.position.setY(e);
            
        // })
        // folder2.add(settings, 'z', -3000, 3000,0.01).onChange(e => {
        //     mesh.position.setZ(e);
            
        // })
        // folder2.add(settings, 'rotate', -Math.PI, Math.PI,0.01).onChange(e => {
        //     mesh.rotation.y = e;
        // })
        folder2.add(settings, '开启射线').onChange(e => {
            if (e) {
                window.addEventListener('mousemove', onMouseMove, false);
                window.addEventListener('dblclick', dbClick);
            } else {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('dblclick', dbClick);
            }
        });
        folder2.add(settings, '打印点位');
        folder2.add(settings, '清空点位');
        folder2.add(settings, '相机/控制器位置');
        folder2.open();
    }

     /* 
        射线一直存在
        双击记录点
    */
    function onMouseMove(event) {
    }

    function dbClick(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0) {
            console.log(intersects[0])
            if (intersects[0].object.name === 'CITY_UNTRIANGULATED') {
                add2DLabel(intersects[0].point, intersects[0].object as any)
            }
            trace.push(intersects[0].point)
        }
    }

    function setCityMaterial(object: any) {
        // 确定oject的geometry的box size
        // 计算当前几何体的的边界矩形，该操作会更新已有 [param:.boundingBox]。
        // 边界矩形不会默认计算，需要调用该接口指定计算边界矩形，否则保持默认值 null。
        object.geometry.computeBoundingBox();
        object.geometry.computeBoundingSphere();

        const { geometry } = object;

        const { center, radius } = geometry.boundingSphere as THREE.Sphere;
        const { max, min } = geometry.boundingBox;
        const size = new THREE.Vector3(
            max.x - min.x,
            max.y - min.y,
            max.z - min.z
        );
        forMaterial(object.material, (material: any) => { // 建筑慢慢变高，材质颜色变化
            // material.opacity = 0.6;
            material.transparent = true;
            material.color.setStyle("#1B3045"); /* 建筑材质的颜色 */
            material.onBeforeCompile = (shader) => { // 在编译shader程序之前立即执行的可选回调。此函数使用shader源码作为参数。用于修改内置材质。
                shader.uniforms.time = time;
                shader.uniforms.uStartTime = StartTime;
                // 中心点
                shader.uniforms.uCenter = {
                    value: center
                }
                // geometry大小
                shader.uniforms.uSize = {
                    value: size
                }
                shader.uniforms.uTopColor = { /* 建筑顶部颜色 */
                    value: new THREE.Color('#1485A6')
                }
                // 扩散
                shader.uniforms.uDiffusion = boWen; /* 水波纹扩散效果 */
                // 扩散中心点
                shader.uniforms.uFlow = saoGuang; /* 建筑从下往上扫光效果 */

                // 效果颜色
                shader.uniforms.uColor = { /* 波纹扩散颜色 */
                    value: new THREE.Color("#5588aa")
                }
                // 效果颜色
                shader.uniforms.uFlowColor = { /* 建筑从下往上的光效颜色 */
                    value: new THREE.Color("#BF3EFF")
                }
                // 波纹扩散半径
                shader.uniforms.uRadius = {
                    value: radius
                }

                /**
                 * 对片元着色器进行修改
                 */
                const fragment = `
                    float distanceTo(vec2 src, vec2 dst) {
                        float dx = src.x - dst.x;
                        float dy = src.y - dst.y;
                        float dv = dx * dx + dy * dy;
                        return sqrt(dv);
                    }

                    float lerp(float x, float y, float t) {
                        return (1.0 - t) * x + t * y;
                    }

                    vec3 getGradientColor(vec3 color1, vec3 color2, float index) {
                        float r = lerp(color1.r, color2.r, index);
                        float g = lerp(color1.g, color2.g, index);
                        float b = lerp(color1.b, color2.b, index);
                        return vec3(r, g, b);
                    }

                    varying vec4 vPositionMatrix;
                    varying vec3 vPosition;

                    uniform float time;
                    // 扩散参数
                    uniform float uRadius;
                    uniform float uOpacity;
                    // 初始动画参数
                    uniform float uStartTime; 

                    uniform vec3 uSize;
                    uniform vec3 uFlow;
                    uniform vec3 uColor;
                    uniform vec3 uCenter;
                    uniform vec3 uTopColor;
                    uniform vec3 uFlowColor;
                    uniform vec3 uDiffusion; 

                    void main() {
                `;
                const fragmentColor = `
                    vec3 distColor = outgoingLight;
                    float dstOpacity = diffuseColor.a;
                    
                    float indexMix = vPosition.z / (uSize.z * 0.6);
                    distColor = mix(distColor, uTopColor, indexMix);
                    
                    // 开启扩散波-波纹扩散效果
                    vec2 position2D = vec2(vPosition.x, vPosition.y);
                    if (uDiffusion.x > 0.5) {
                        // 扩散速度
                        float dTime = mod(time * uDiffusion.z, uRadius * 2.0);
                        // 当前的离中心点距离
                        float uLen = distanceTo(position2D, vec2(uCenter.x, uCenter.z));

                        // 扩散范围
                        if (uLen < dTime && uLen > dTime - uDiffusion.y) {
                            // 颜色渐变
                            float dIndex = sin((dTime - uLen) / uDiffusion.y * PI);
                            distColor = mix(uColor, distColor, 1.0 - dIndex);
                        }
                    }

                    // 流动效果-建筑从下往上的光效
                    if (uFlow.x > 0.5) {
                        // 扩散速度
                        float dTime = mod(time * uFlow.z, uSize.z); 
                        // 流动范围
                        float topY = vPosition.z + uFlow.y;
                        if (dTime > vPosition.z && dTime < topY) {
                            // 颜色渐变 
                            float dIndex = sin((topY - dTime) / uFlow.y * PI);

                            distColor = mix(distColor, uFlowColor,  dIndex); 
                        }
                    }
                

                    gl_FragColor = vec4(distColor, dstOpacity * uStartTime);
                `;
                shader.fragmentShader = shader.fragmentShader.replace("void main() {", fragment)
                shader.fragmentShader = shader.fragmentShader.replace("#include <output_fragment>", fragmentColor);
                /**
                 * 对顶点着色器进行修改
                 */
                const vertex = `
                    varying vec4 vPositionMatrix;
                    varying vec3 vPosition;
                    uniform float uStartTime;
                    void main() {
                            vPositionMatrix = projectionMatrix * vec4(position, 1.0);
                            vPosition = position;
                `
                const vertexPosition = `
                    vec3 transformed = vec3(position.x, position.y, position.z * uStartTime);
                `

                shader.vertexShader = shader.vertexShader.replace("void main() {", vertex);
                shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", vertexPosition);
            }
        })
    }

    /**
     * 获取包围线条效果
     */
    function surroundLine(object) {
        // 获取线条geometry
        const geometry = surroundLineGeometry(object);
        // 获取物体的世界坐标 旋转等
        const worldPosition = new THREE.Vector3();
        object.getWorldPosition(worldPosition);

        // 传递给shader重要参数
        const {
            max,
            min
        } = object.geometry.boundingBox;

        const size = new THREE.Vector3(
            max.x - min.x,
            max.y - min.y,
            max.z - min.z
        );

        const material = createSurroundLineMaterial({
            max,
            min,
            size
        });
        // 将若干的定点绘制一系列的线
        const line = new THREE.LineSegments(geometry, material);

        line.name = 'surroundLine';

        line.scale.copy(object.scale);
        line.rotation.copy(object.rotation);
        line.position.copy(worldPosition);

        scene.add(line);
    }

    /**
    * 创建包围线条材质
    */
    function createSurroundLineMaterial({
        max,
        min,
        size
    }) {
        if (surroundLineMaterial) return surroundLineMaterial;

        surroundLineMaterial = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
                uColor: { /* 包围线条的颜色 */
                    value: new THREE.Color("#11A4A1")
                },
                uActive: { /* 矩形横扫线的颜色 */
                    value: new THREE.Color("#ffffff")
                },
                time: time,
                uOpacity: {
                    value: 0.6
                }, /* 矩形横扫线的透明度 */
                uMax: {
                    value: max,
                },
                uMin: {
                    value: min,
                },
                uRange: uRange, /* 矩形横扫线的宽度 */
                uSpeed: uSpeed, /* 矩形横扫线的速度 */
                uStartTime: StartTime
            },
            // 顶点着色器的GLSL代码。(OpenGL Shading Language)
            vertexShader: Shader.surroundLine.vertexShader,
            fragmentShader: Shader.surroundLine.fragmentShader
        });

        return surroundLineMaterial;
    }

    function setFloor(object) {
        forMaterial(object.material, (material) => {
            material.color.setStyle('#040912');
        })
    }

    function setRiver() {
        const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
        water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('/textures/waternormals.jpg', function (texture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: scene.fog !== undefined
            }
        );
        water.rotation.x = - Math.PI / 2;
        water.position.setY(9)
    }

    function loadCity() {
        // 需要做城市效果的mesh 
        const cityArray = ['CITY_UNTRIANGULATED']; // 建筑
        const floorArray = ['LANDMASS']; // 地面
        // const riverArray = ['drive']; //不知道是啥
        // const roadsArray = ['ROADS']; //路网
        // const chairArray = ['chair']; //不知道是啥

        const fbxLoader = new FBXLoader();
        fbxLoader.load('/fbxs/shanghai.FBX', fbx => {
            fbx.traverse(child => {
                if (cityArray.includes(child.name)) {
                    setCityMaterial(child); /* 建筑 */
                    surroundLine(child); /* 包围线效果 */
                }
                if (floorArray.includes(child.name)) {
                    setFloor(child)
                }
            })
            scene.add(fbx);
            // setRiver();
            const t$ = setTimeout(() => {
                isStart = true;
                // 加载围栏墙
                wallBoxData.forEach((data) => {
                    const mesh = WallBox(data);
                    mesh.material.uniforms.time = time;
                    mesh.position.setY(data.positions[0][1]);
                    mesh.renderOrder = 1;
                    wallBox.push(mesh);
                    scene.add(mesh);
                });
                // 加载扫描效果
                radarData.forEach((data) => {
                    const mesh = Radar(data);
                    mesh.material.uniforms.time = time;
                    radar.push(mesh);
                    scene.add(mesh);
                });
                // 光墙
                wallData.forEach((data) => {
                    const mesh = Wall(data);
                    mesh.material.uniforms.time = time;
                    wall.push(mesh);
                    scene.add(mesh);
                });
                // 飞线
                flyData.forEach((data) => {
                    const mesh = Fly(data);
                    mesh.material.uniforms.time = time;
                    mesh.renderOrder = 10;
                    fly.push(mesh)
                    scene.add(mesh);
                });
                clearTimeout(t$);
            }, 1000);
        })
    }

    function render() {
        rafId = requestAnimationFrame(render);
        group.update();
        TWEEN.update();
        const dt = clock.getDelta();
        if (mixer) {
            mixer.update(dt);
        }
        if (settings['车流']) {
            carList.forEach(item => {
                if (item.progress < 1 && !item.paused) {
                    const temp = dt * (item.speed * 1000 / 3600) / item.catmullRomCurve3Length;
                    const time = -performance.now() / 1000;
                    for (let i = 0; i < item.wheels.length; i++) { /* 转动车轮 */
                        item.wheels[i].rotation.x = time * Math.PI;
                    }
                    item.progress += temp;
                    if (item.progress >= 1) {
                        item.progress = 1;
                        item.speed = (Math.floor(Math.random() * 60) + 60);
                    } else if (item.progress - 0.0001 < 0) {
                        item.progress = 0.0001;
                    }
                    let point = item.catmullRomCurve3.getPointAt(item.progress); /* 也是向量切线的终点坐标 */
                    
                    const tangent = item.catmullRomCurve3.getTangentAt(item.progress - Math.floor(item.progress)).multiplyScalar(10); /* 单位向量切线 */
                    const startPoint = new THREE.Vector3(point.x - tangent.x, point.y - tangent.y, point.z - tangent.z); /* 向量切线的起点坐标 */
    
                    const point1 = item.catmullRomCurve3.getPointAt(item.progress - 0.0001);
                    if (point && point.x) {
                        item.position.copy(point);
                        if (item.progress < 1) { /* 此判断条件用来确保：车头保持原先的方向 */
                            item.lookAt(point1); /* 转弯、掉头动作 */
                            if (item.follow) {
                                camera.position.copy(startPoint).setY(startPoint.y + 3);
                                controls.target.copy(point);
                            }
                        }
                    }
                } else if (item.progress >= 1 && !item.paused) {
                    item.progress = 0;
                }
    
            });
        }
        if (texture) {
            texture.offset.x -= 0.02;
        }
        if (destory && rafId) {
            cancelAnimationFrame(rafId);
        }
        if (dt <= 1) {
            time.value += dt; /* 扫光 */
            if (isStart) {
                StartTime.value += dt * 0.5; /* 建筑慢慢长高 */
                if (StartTime.value >= 1) {
                    StartTime.value = 1;
                    isStart = false;
                }
            }
        }
        if (settings['下雪'] && snowInfo) {
            snowInfo.animate();
        }
        controls?.update();
        if (water) {
            water.material.uniforms['time'].value += 1.0 / 60.0;
        }
        renderer?.render(scene, camera);
        if (settings['顶牌']) {
            labelRenderer?.render(scene, camera);
        }
    }
    return (
        <div id="parent">
            <canvas id="three" style={{zIndex: 1}}></canvas>
            <video id="video" loop crossOrigin="anonymous" style={{display: 'none'}}>
                {/* <source src="textures/sintel.mp4" type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"' /> */}
                <source src="textures/motovis.mp4" type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"' />
		    </video>
        </div>
    )
}