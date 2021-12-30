import { useEffect } from "react";
import * as THREE from 'three';
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { forMaterial, surroundLineGeometry } from './three-info';
import Shader from './shader';
import {
    Radar,
    Wall,
    Fly
} from './effect/index';

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
},]
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
        loadCity();

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
            material.color.setStyle("#1B3045");
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
                shader.uniforms.uMax = {
                    value: max
                }
                shader.uniforms.uMin = {
                    value: min
                }
                shader.uniforms.uTopColor = {
                    value: new THREE.Color('#00FF00')
                }
                // 效果开关
                shader.uniforms.uSwitch = {
                    value: new THREE.Vector3(
                        0, // 扩散
                        0, // 左右横扫
                        0 // 向上扫描
                    )
                };
                // 扩散
                shader.uniforms.uDiffusion = { /* 从中心往外波纹扩散 */
                    value: new THREE.Vector3(
                        1, // 0 1开关
                        20, // 范围
                        600 // 速度
                    )
                };
                // 扩散中心点
                shader.uniforms.uDiffusionCenter = {
                    value: new THREE.Vector3(
                        0, 0, 0
                    )
                };
                // 扩散中心点
                shader.uniforms.uFlow = { /* 建筑从下往上的光效 */
                    value: new THREE.Vector3(
                        1, // 0 1开关
                        10, // 范围
                        60 // 速度
                    )
                };

                // 效果颜色
                shader.uniforms.uColor = { /* 波纹扩散颜色 */
                    value: new THREE.Color("#5588aa")
                }
                // 效果颜色
                shader.uniforms.uFlowColor = { /* 建筑从下往上的光效颜色 */
                    value: new THREE.Color("#BF3EFF")
                }
                // 效果透明度
                shader.uniforms.uOpacity = {
                    value: 1
                }
                // 效果透明度
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

                    uniform vec3 uMin;
                    uniform vec3 uMax;
                    uniform vec3 uSize;
                    uniform vec3 uFlow;
                    uniform vec3 uColor;
                    uniform vec3 uCenter;
                    uniform vec3 uSwitch;
                    uniform vec3 uTopColor;
                    uniform vec3 uFlowColor;
                    uniform vec3 uDiffusion; 
                    uniform vec3 uDiffusionCenter;

                    void main() {
                `;
                const fragmentColor = `
                    vec3 distColor = outgoingLight;
                    float dstOpacity = diffuseColor.a;
                    
                    float indexMix = vPosition.z / (uSize.z * 0.6);
                    distColor = mix(distColor, uTopColor, indexMix);
                    
                    // 开启扩散波
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
                shader.fragmentShader = shader.fragmentShader.replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", fragmentColor);

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
                    value: new THREE.Color("#ffffff")
                },
                uActive: { /* 矩形横扫线的颜色 */
                    value: new THREE.Color("#ff0000")
                },
                time: time,
                uOpacity: { /* 矩形横扫线的透明度 */
                    value: 0.6
                },
                uMax: {
                    value: max,
                },
                uMin: {
                    value: min,
                },
                uRange: { /* 矩形横扫线的宽度 */
                    value: 100
                },
                uSpeed: { /* 矩形横扫线的速度 */
                    value: 0.2
                },
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

    function loadCity() {
        // 需要做城市效果的mesh 
        const cityArray = ['CITY_UNTRIANGULATED'];
        const floorArray = ['LANDMASS'];

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
            const t$ = setTimeout(() => {
                isStart = true;
                // 加载扫描效果
                // radarData.forEach((data) => {
                //     const mesh = Radar(data);
                //     mesh.material.uniforms.time = time;
                //     scene.add(mesh);
                // });
                // // 光墙
                // wallData.forEach((data) => {
                //     const mesh = Wall(data);
                //     mesh.material.uniforms.time = time;
                //     scene.add(mesh);
                // });
                // // 飞线
                // flyData.forEach((data) => {
                //     const mesh = Fly(data);
                //     mesh.material.uniforms.time = time;
                //     mesh.renderOrder = 10;
                //     scene.add(mesh);
                // });
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
        renderer?.render(scene, camera);
        rafId = requestAnimationFrame(render);
    }
    return (
        <canvas id="three"></canvas>
    )
}