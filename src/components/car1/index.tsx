import { useEffect, useRef } from "react"
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function MaterialCar() {
    const modalRef = useRef<{
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
        controls: OrbitControls
    }>({ wheels: [] } as any);

    let { road, camera, scene, renderer, carModel, grid, bodyColorInput, detailsColorInput, glassColorInput, wheels, controls } = modalRef.current;

    useEffect(() => {
        init();
        return () => {
            camera.clear();
            scene.clear();
            renderer.clear();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

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
        
        const axesHelper = new THREE.AxesHelper(1000); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        scene.add(axesHelper);

        // grid = new THREE.GridHelper(100, 40, 0x000000, 0x000000);
        // grid.material['opacity'] = 0.1;
        // grid.material['depthWrite'] = false;
        // grid.material['transparent'] = true;
        // scene.add(grid);

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
            wheels.push(
                carModel.getObjectByName('wheel_fl'),
                carModel.getObjectByName('wheel_fr'),
                carModel.getObjectByName('wheel_rl'),
                carModel.getObjectByName('wheel_rr')
            );
            // shadow
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
                new THREE.MeshBasicMaterial({
                    map: shadow, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true
                })
            );
            mesh.rotation.x = - Math.PI / 2;
            mesh.renderOrder = 2;
            // carModel.add(mesh);

            scene.add(carModel);
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

    function render() {
        const time = - performance.now() / 1000;
        for (let i = 0; i < wheels.length; i++) {
            wheels[i].rotation.x = time * Math.PI;
        }
        // grid.position.z = - (time) % 5;
        if (carModel) {
            if (-time * 1 >= 50) {
                console.log('clear')
                carModel.clear();
                carModel = null;
            } else {
                carModel.position.z = time * 1
            }
        }
        // camera.position.z = 100 + time * 10
        // road.position.z = - (time) % 5;
        renderer.render(scene, camera);
    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}