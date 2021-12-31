import { useEffect } from "react";
import * as THREE from 'three';
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Water } from 'three/examples/jsm/objects/Water';
import { forMaterial, surroundLineGeometry } from './three-info';
import Shader from './shader';
import {
    Radar,
    Wall,
    Fly
} from './effect/index';
import * as dat from 'dat.gui';

/**
 * 智慧城市光影效果
 *
 * @export
 * @return {*} 
 */
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;
let clock = new THREE.Clock();
let destory;
let rafId;
let water: Water;
let gui: dat.GUI;
let settings: any = {};
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
}]

export default function City() {

    useEffect(() => {
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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(1200, 700, 121)
        scene.add(camera)

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
        controls.maxPolarAngle = Math.PI / 2.01;
        controls.screenSpacePanning = false;
        controls.target.set(2, 0, 0);
        loadCity();

        createPanel();
        // scene.add(new THREE.AxesHelper(1660))

        window.addEventListener('resize', onWindowResize);

        render();
    }

    function onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.render(scene, camera);
    }

    /* 创建GUI */
    function createPanel() {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        dat.GUI.TEXT_OPEN = '打开Controls';
        gui = new dat.GUI();
        const folder = gui.addFolder('特效');
        settings = {
            '河流': false,
            '雷达扫描': true,
            '建筑扫光': true,
            '投递飞线': true,
            '光墙': true,
            '波纹扩散': true,
            '横扫光线': true
        }
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
        folder.open();
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
        const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
        water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('/textures/waternormals.jpg', function ( texture ) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                } ),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: scene.fog !== undefined
            }
        );
        water.rotation.x = - Math.PI / 2;
        water.position.setY(8)
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
            console.log(fbx)
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
        if (destory && rafId) {
            cancelAnimationFrame(rafId);
        }
        const dt = clock.getDelta();
        if (dt <=1 ) {
            time.value += dt; /* 扫光 */
            if (isStart) {
                StartTime.value += dt * 0.5; /* 建筑慢慢长高 */
                if (StartTime.value >= 1) {
                    StartTime.value = 1;
                    isStart = false;
                }
            }
        }
        controls?.update();
        if (water) {
            water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
        }
        renderer?.render(scene, camera);
        rafId = requestAnimationFrame(render);
    }
    return (
        <canvas id="three"></canvas>
    )
}