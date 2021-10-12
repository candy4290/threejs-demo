import { useEffect, useRef } from "react"
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as dat from 'dat.gui';
import './index.less';

export default function MaterialCar() {
    const modalRef = useRef<{
        clock: THREE.Clock,
        curve: THREE.CatmullRomCurve3,
        progress: number,
        carModel: any,
        camera: THREE.PerspectiveCamera,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        grid: THREE.GridHelper,
        road: THREE.Mesh
        bodyColorInput: HTMLElement | null,
        detailsColorInput: HTMLElement | null,
        glassColorInput: HTMLElement | null,
        wheels: any[],
        controls: OrbitControls,
        gui: dat.GUI,
        settings: any,
        stopContinueControls: dat.GUIController[]
    }>({ wheels: [], progress: 0, stopContinueControls: [] } as any);

    let { clock, curve, progress, road, camera, scene, renderer, carModel, bodyColorInput, detailsColorInput, glassColorInput, wheels, controls, gui, settings, stopContinueControls } = modalRef.current;

    useEffect(() => {
        init();
        return () => {
            camera.clear();
            scene.clear();
            renderer.clear();
            gui.destroy();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        clock = new THREE.Clock();

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(render);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.85; /* 色调映射的曝光级别 */

        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.set(1, 2, 10);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.maxPolarAngle = Math.PI / 2.01;
        controls.target.set(0, 0, 0);
        controls.update();

        const pmremGenerator = new THREE.PMREMGenerator(renderer);

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xeeeeee);
        scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture;
        // scene.fog = new THREE.Fog(0xeeeeee, 10, 50);

        // createGround();

        const axesHelper = new THREE.AxesHelper(50); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        scene.add(axesHelper);

        createRoad();

        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xff0000, metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05
        });

        const detailsMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, metalness: 1.0, roughness: 0.5
        });

        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, metalness: 0, roughness: 0.1, transmission: 0.9, transparent: true
        });

        bodyColorInput = document.getElementById('body-color');
        bodyColorInput?.addEventListener('input', function (e: any) {
            bodyMaterial.color.set(e.target.value);
        });

        detailsColorInput = document.getElementById('details-color');
        detailsColorInput?.addEventListener('input', function (e: any) {
            detailsMaterial.color.set(e.target.value);
        });

        glassColorInput = document.getElementById('glass-color');
        glassColorInput?.addEventListener('input', function (e: any) {
            glassMaterial.color.set(e.target.value);
        });
        // Car
        const shadow = new THREE.TextureLoader().load('/glbs/ferrari_ao.png');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/js/libs/draco/gltf/');

        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        drawLine();
        loader.load('/glbs/ferrari.glb', function (gltf) {
            console.log(gltf)
            carModel = gltf.scene.children[0];
            carModel.getObjectByName('body').material = bodyMaterial;
            carModel.getObjectByName('rim_fl').material = detailsMaterial;
            carModel.getObjectByName('rim_fr').material = detailsMaterial;
            carModel.getObjectByName('rim_rr').material = detailsMaterial;
            carModel.getObjectByName('rim_rl').material = detailsMaterial;
            carModel.getObjectByName('trim').material = detailsMaterial;
            carModel.getObjectByName('glass').material = glassMaterial;
            carModel.position.x = 2;
            carModel.paused = true;

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
            // carModel.lookAt(2,0,1);
            // carModel.add(mesh);

            scene.add(carModel);
        });

        createPanel();

    }

    function drawLine() {
        curve = new THREE.CatmullRomCurve3([ /* 平滑三维曲线 */
            new THREE.Vector3(2, 0, 0),
            new THREE.Vector3(2, 0, -40),
            new THREE.Vector3(1, 0, -43),
            new THREE.Vector3(0, 0, -43.5),
            new THREE.Vector3(-1, 0, -43),
            new THREE.Vector3(-2, 0, -40),
            new THREE.Vector3(-2, 0, 40),
            new THREE.Vector3(-1, 0, 43),
            new THREE.Vector3(0, 0, 43.5),
            new THREE.Vector3(1, 0, 43),
            new THREE.Vector3(2, 0, 40),
            new THREE.Vector3(2, 0, 0),
        ], false/*是否闭合*/);

        // const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.1, 50, false); /* 管道缓冲几何体 100-分段数 0.6-管道半径 50-管道横截面的分段数目 */
        // const textureLoader = new THREE.TextureLoader();
        // const texture = textureLoader.load('run.jpg');
        // // 设置阵列模式为 RepeatWrapping
        // texture.wrapS = THREE.RepeatWrapping;
        // texture.wrapT = THREE.RepeatWrapping;
        // // 设置x方向的偏移(沿着管道路径方向)，y方向默认1
        // //等价texture.repeat= new THREE.Vector2(20,1)
        // texture.repeat.x = 20;
        // const tubeMaterial = new THREE.MeshPhongMaterial({ /* 具有镜面高光的光泽表面的材质 */
        //     map: texture,
        //     transparent: true,
        // });
        // const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        // scene.add(tube)
        /**
         * 创建一个半透明管道
         */
        const tubeGeometry2 = new THREE.TubeGeometry(curve, 100, 0.05, 50, false);
        const tubeMaterial2 = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.3,
        });
        const tube2 = new THREE.Mesh(tubeGeometry2, tubeMaterial2);
        scene.add(tube2)

    }

    /* 创建地面 */
    function createGround() {
        const groundTexture = new THREE.TextureLoader().load('/textures/terrain/grasslight-big.jpg');
        groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(25, 25);
        groundTexture.anisotropy = 16;
        groundTexture.encoding = THREE.sRGBEncoding;

        const groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture });

        let mesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 100), groundMaterial);
        mesh.position.y = - 0.01;
        mesh.rotation.x = - Math.PI / 2;
        mesh.receiveShadow = true;
        scene.add(mesh);

        scene.add(new THREE.AmbientLight(0x666666)); /* 环境光-均匀照亮所有物体 */
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
        // textureLoader.load("textures/hardwood2_bump.jpg", function (map) {
        //     map.wrapS = THREE.RepeatWrapping;
        //     map.wrapT = THREE.RepeatWrapping;
        //     map.anisotropy = 4;
        //     map.repeat.set(10, 24);
        //     floorMat.bumpMap = map; /* 创建凹凸贴图的纹理 */
        //     floorMat.needsUpdate = true;
        // });
        const floorGeometry = new THREE.PlaneGeometry(10, 100); /* 平面缓冲几何体 */
        const floorGeometry2 = new THREE.PlaneGeometry(10, 100); /* 平面缓冲几何体-背面 */
        road = new THREE.Mesh(floorGeometry, floorMat);
        road.receiveShadow = true;
        road.rotation.x = - Math.PI / 2.0;
        const road2 = new THREE.Mesh(floorGeometry2, floorMat);
        road2.receiveShadow = true;
        road2.rotation.x = Math.PI / 2.0;
        scene.add(road);
        scene.add(road2);
    }

    function createPanel() {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        dat.GUI.TEXT_OPEN = '打开Controls';
        gui = new dat.GUI();
        const folder1 = gui.addFolder('车辆状态');
        const folder2 = gui.addFolder('视角');
        settings = {
            '暂停': () => {
                carModel.paused = true;
            },
            '继续': () => {
                carModel.paused = false;
                if (progress >= 1) {
                    progress = 0;
                }
            },
            '相机跟随': false,
            '车速(km/h)': 40,
        }
        stopContinueControls.push(folder1.add(settings, '暂停'));
        stopContinueControls.push(folder1.add(settings, '继续'));
        folder1.add(settings, '车速(km/h)', 0, 400, 10);
        folder2.add(settings, '相机跟随').onChange(e => {

        });

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
        if (carModel.paused || progress >= 1) {
            (stopContinueControls[0] as any).setDisabled();
            (stopContinueControls[1] as any).setEnabled();
        } else {
            (stopContinueControls[0] as any).setEnabled();
            (stopContinueControls[1] as any).setDisabled();
        }

    }

    function render() {
        const t = clock.getDelta();
        const temp = t * (settings['车速(km/h)'] * 1000 / 3600) / 200;
        const time = - performance.now() / 1000;
        renderer.render(scene, camera);
        if (carModel) {
            updateCrossFadeControls();
        }
        if (progress >= 1) {
            return;
        }
        if (curve && carModel && !carModel.paused) {
            for (let i = 0; i < wheels.length; i++) { /* 转动车轮 */
                wheels[i].rotation.x = time * Math.PI;
            }
            progress += temp;
            const point = curve.getPoint(progress);
            const point1 = curve.getPoint(progress - 0.0001);
            // const point2 = curve.getPoint(progress - 0.0002);
            // const point3 = curve.getPoint(progress + 0.2);
            if (point && point.x) {
                carModel.position.set(point.x, point.y, point.z);
                carModel.lookAt(point1); /* 转弯、掉头动作 */
                if (settings['相机跟随']) {
                    // camera.position.set(point2.x, 2, point2.z);
                    // camera.lookAt(point3)
                }
            }
        }
    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}