import { useEffect, useRef } from "react"
import * as THREE from 'three';
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import './index.less';
import { traces, translateFunc } from "../../utils/map";
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { createComposerAndRenderPass, createFxaa, createMovingLine, createUnrealBloomPass } from "../../utils/threejs-util";
import { createOutLine } from "../../utils/threejs-util";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

const anmations: {
    index: number;
    verticNum: number;
    mesh: Line2;
    linePointsV3: THREE.Vector3[];
}[] = [];

const darkMaterial = new THREE.MeshBasicMaterial({ color: "black", opacity: 0 });
const materials = {};

export default function MaterialCar() {
    const modalRef = useRef<{
        matLine: LineMaterial,
        traceRelated: any[], /* 轨迹相关 */
        lines: [number, number][][],
        clock: THREE.Clock,
        curve: THREE.CatmullRomCurve3,
        carModel: any,
        camera: THREE.PerspectiveCamera,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        grid: THREE.GridHelper,
        road: THREE.Mesh
        wheels: any[],
        controls: MapControls,
        gui: dat.GUI,
        settings: any,
        stopContinueControls: dat.GUIController[],
        composer: EffectComposer | null,
        bloomPass: UnrealBloomPass,
        outlinePass: OutlinePass,
        effectFXAA: ShaderPass,
        mouse: THREE.Vector2,
        selectedObjects: any[],
        light: THREE.DirectionalLight,
        needBloomed: any[],
    }>({
        traceRelated: [], wheels: [], progress: 0, stopContinueControls: [], mouse: new THREE.Vector2(), selectedObjects: [],
        lines: [
            [
                [2, 0],
                [2, -40],
                [1, -43],
                [0, -43.5],
                [-1, -43],
                [-2, -40],
                [-2, 40],
                [-1, 43],
                [0, 43.5],
                [1, 43],
                [2, 40],
                [2, 0],
            ]
        ], needBloomed: []
    } as any);

    let { matLine, lines, clock, curve, road, camera, scene, renderer, carModel, wheels, controls, gui, settings, stopContinueControls,
        composer, traceRelated, light, needBloomed, bloomPass, outlinePass, effectFXAA } = modalRef.current;

    useEffect(() => {
        getZbs();
        init();
        window.addEventListener('resize', onWindowResize);
        return () => {
            camera.clear();
            scene.clear();
            renderer.clear();
            gui.destroy();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function getZbs() {
        console.log(traces.length, traces[Math.floor(traces.length / 2)])
        const projection = translateFunc(traces[Math.floor(traces.length / 2)], 100000 * 54.45);
        const result: [number, number][] = [];
        traces.forEach(item => {
            const t = projection(item);
            if (t) {
                result.push(t);
            }
        });
        const distance = Math.sqrt(Math.pow((result[0][0] - result[result.length - 1][0]), 2) + Math.pow((result[0][1] - result[result.length - 1][1]), 2));
        console.log(distance);
        lines.push(result);
    }

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        clock = new THREE.Clock();

        renderer = new THREE.WebGLRenderer({ canvas });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true; /* 渲染器开启阴影渲染 */
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.85; /* 色调映射的曝光级别 */

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.set(2, 2, 20);

        controls = new MapControls(camera, renderer.domElement);
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;

        controls.maxPolarAngle = Math.PI / 2.01;
        controls.screenSpacePanning = false;
        controls.target.set(2, 0, 0);

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        scene = new THREE.Scene();
        // scene.background = new THREE.Color(0xeeeeee);
        // scene.background = createSkyBox();
        scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture; /* 该纹理贴图将会被设为场景中所有物理材质的环境贴图 */
        // // scene.fog = new THREE.Fog(0xeeeeee, 10, 50);

        composer = createComposerAndRenderPass(renderer, scene, camera).composer;
        composer.readBuffer.texture.encoding = renderer.outputEncoding;

        light = new THREE.DirectionalLight(0xffffff);
        light.position.set(20, 20, 20);
        light.castShadow = true; /* 灯光开启“引起阴影” */
        scene.add(light);

        const axesHelper = new THREE.AxesHelper(50); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        // scene.add(axesHelper);

        drawLine(); /* 轨迹曲线 */

        createRoad(); /* 马路 */
        createCar(); /* 车 */

        createPanel(); /* gui面板 */

        render();
    }

    /* 加载车的模型 */
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
            carModel.position.x = 2;
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

    /* 绘制轨迹 */
    function drawLine(index = 0) {
        curve = new THREE.CatmullRomCurve3([ /* 平滑三维曲线 */
            ...lines[index].map(item => new THREE.Vector3(item[0], 0, item[1]))
        ], false/*是否闭合*/,
            'catmullrom', 0
        );

        /* 画出过原来路径的几个点的直线 */
        const points = lines[index].map(item => new THREE.Vector3(item[0], 0, item[1]));
        const boxGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
        points.forEach(point => {
            const p = new THREE.Mesh(boxGeometry, boxMaterial);
            p.position.set(point.x, point.y, point.z);
            traceRelated.push(p);
            scene.add(p);
        })

        const positions: number[] = [];
        points.forEach(item => {
            positions.push(item.x, item.y, item.z);
        })
        const geometry = new LineGeometry();
        geometry.setPositions(positions);
        matLine = new LineMaterial({
            transparent: true,
            color: 0xbb9246,
            linewidth: 4, // in pixels
            vertexColors: false,
            dashed: false,
            alphaToCoverage: true,
        });
        const line = new Line2(geometry, matLine);
        line.computeLineDistances();
        line.scale.set(1, 1, 1);
        line.position.setY(0.1);
        traceRelated.push(line);
        scene.add(line);
        needBloomed = [];
        new Array(1).fill(0).forEach((it, i) => {
            const movingLine = createMovingLine(curve, i * 100);
            anmations.push(movingLine);
            movingLine.mesh.userData = {
                'isGuijiMesh': true,
                'bloom': true
            }
            movingLine.mesh.visible = false;
            needBloomed.push(movingLine.mesh);
            scene.add(movingLine.mesh);
            traceRelated.push(movingLine.mesh);
        });
    }

    /* 创建马路 */
    function createRoad() {
        const floorMat = new THREE.MeshStandardMaterial({
            roughness: 0.8, /* 材质的粗糙程度 0-镜面反射 1-完全漫反射 */
            color: 0xffffff, /* 材质颜色 */
            metalness: 0.2, /* 材质与金属的相似度 木材/石材-0 金属-1 */
            bumpScale: 0.0005 /* 凹凸贴图会对材质产生多大的影响 */
        });
        const textureLoader = new THREE.TextureLoader(); /* 加载texture */
        textureLoader.load("/textures/roads/road.jpg", map => {
            map.wrapS = THREE.MirroredRepeatWrapping; /* 纹理贴图在水平方向上如何包裹 */
            map.wrapT = THREE.MirroredRepeatWrapping; /* 纹理贴图在垂直方向上如何包裹 */
            map.anisotropy = 4;
            map.repeat.set(1, 5);
            map.encoding = THREE.sRGBEncoding;
            floorMat.map = map; /* 颜色贴图 */
            floorMat.needsUpdate = true; /* 指定需要重新编译材质 */
        });
        const floorGeometry = new THREE.PlaneGeometry(10, 100); /* 平面缓冲几何体 */
        road = new THREE.Mesh(floorGeometry, floorMat);
        road.receiveShadow = true;
        road.rotation.x = - Math.PI / 2.0;
        scene.add(road);
    }

    /* 创建GUI */
    function createPanel() {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        dat.GUI.TEXT_OPEN = '打开Controls';
        gui = new dat.GUI();
        const folder0 = gui.addFolder('轨迹');
        const folder1 = gui.addFolder('车辆状态');
        const folder2 = gui.addFolder('视角');
        const folder3 = gui.addFolder('后期处理');
        settings = {
            '轨迹列表': '轨迹1',
            '轨迹动画': false,
            '暂停': () => {
                carModel.paused = true;
            },
            '继续': () => {
                carModel.paused = false;
                if (carModel.progress >= 1) {
                    carModel.progress = 0;
                }
            },
            '相机跟随': false,
            '车速(km/h)': 40,
            '轨迹光效': false,
            '泛光': false,
            '抗锯齿': false
        }
        stopContinueControls.push(folder1.add(settings, '暂停'));
        stopContinueControls.push(folder1.add(settings, '继续'));
        folder0.add(settings, '轨迹列表').options(['轨迹1', '轨迹2']).onChange(e => {
            traceRelated.forEach(item => {
                scene.remove(item);
                item.geometry.dispose();
            })
            const idx = ['轨迹1', '轨迹2'].indexOf(e);
            drawLine(idx);
        });
        folder0.add(settings, '轨迹动画').onChange(e => {
            traceRelated.forEach(item => {
                if (item.userData && item.userData.isGuijiMesh) {
                    item.visible = e;
                }
            })
        })
        folder1.add(settings, '车速(km/h)', 0, 400, 10);
        folder2.add(settings, '相机跟随').onChange(e => {
            if (!e) {
                controls.reset();
            }
        });
        folder3.add(settings, '轨迹光效').onChange(e => {
            if (e && composer) {
                bloomPass = createUnrealBloomPass(composer, scene, camera, renderer, needBloomed).bloomPass;
            } else {
                composer?.removePass(bloomPass);
            }
        });
        folder3.add(settings, '泛光').onChange(e => {
            if (e && composer) {
                outlinePass = createOutLine(composer, renderer, scene, camera).outlinePass;
            } else {
                composer?.removePass(outlinePass);
            }
        });
        folder3.add(settings, '抗锯齿').onChange(e => {
            if (e && composer) {
                effectFXAA = createFxaa(composer).effectFXAA;
                if (settings['泛光']) {
                    outlinePass = createOutLine(composer, renderer, scene, camera).outlinePass;
                }
                if (settings['轨迹光效']) {
                    bloomPass = createUnrealBloomPass(composer, scene, camera, renderer, needBloomed).bloomPass;
                }
            } else {
                composer?.removePass(effectFXAA);
            }
        });
        folder0.open();
        folder1.open();
        folder2.open();
        folder3.open();

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

    /* 天空盒 */
    function createSkyBox() {
        const path = "/textures/cube/Park3Med/";
        const urls = [
            'px.jpg',
            'nx.jpg',
            'py.jpg',
            'ny.jpg',
            'pz.jpg',
            'nz.jpg'
        ];
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        return cubeTextureLoader.setPath(path).load(urls);
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
        matLine.resolution.set(window.innerWidth, window.innerHeight);
        const t = clock.getDelta();
        const temp = t * (settings['车速(km/h)'] * 1000 / 3600) / 200;
        const time = - performance.now() / 1000;

        if (settings['轨迹动画']) {
            anmations.forEach((item) => {
                item.index + 1 > item.linePointsV3.length - item.verticNum
                    ? (item.index = 0)
                    : (item.index += 3);
                item.mesh.geometry.setPositions(
                    item.linePointsV3
                        .slice(item.index, item.index + item.verticNum)
                        .reduce((arr: number[], item) => {
                            return arr.concat(item.x, item.y, item.z);
                        }, [])
                );
            });
        }

        if (carModel) {
            updateCrossFadeControls();
        }
        if (curve && carModel && carModel.progress < 1 && !carModel.paused) {
            for (let i = 0; i < wheels.length; i++) { /* 转动车轮 */
                wheels[i].rotation.x = time * Math.PI;
            }
            carModel.progress += temp;
            const point = curve.getPoint(carModel.progress); /* 也是向量切线的终点坐标 */
            const tangent = curve.getTangent(carModel.progress - Math.floor(carModel.progress)).multiplyScalar(10); /* 单位向量切线 */
            const startPoint = new THREE.Vector3(point.x - tangent.x, point.y - tangent.y, point.z - tangent.z); /* 向量切线的起点坐标 */

            const point1 = curve.getPoint(carModel.progress - 0.0001);
            if (point && point.x) {
                carModel.position.copy(point);
                carModel.lookAt(point1); /* 转弯、掉头动作 */

                if (settings['相机跟随']) {
                    camera.position.copy(startPoint).setY(20);
                    controls.target.copy(point);
                }
            }
        }
        controls?.update(); /* only required if controls.enableDamping = true, or if controls.autoRotate = true */
        renderer.render(scene, camera);
        if (composer && composer.passes.length > 0) {
            composer.render();
        }
    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}