import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';

/**
 * 物理光源
 *
 * @export
 * @return {*} 
 */
const bulbLuminousPowers = {
    "110000 lm (1000W)": 110000,
    "3500 lm (300W)": 3500,
    "1700 lm (100W)": 1700,
    "800 lm (60W)": 800,
    "400 lm (40W)": 400,
    "180 lm (25W)": 180,
    "20 lm (4W)": 20,
    "Off": 0
};

// ref for solar irradiances: https://en.wikipedia.org/wiki/Lux
const hemiLuminousIrradiances = {
    "0.0001 lx (Moonless Night)": 0.0001,
    "0.002 lx (Night Airglow)": 0.002,
    "0.5 lx (Full Moon)": 0.5,
    "3.4 lx (City Twilight)": 3.4,
    "50 lx (Living Room)": 50,
    "100 lx (Very Overcast)": 100,
    "350 lx (Office Room)": 350,
    "400 lx (Sunrise/Sunset)": 400,
    "1000 lx (Overcast)": 1000,
    "18000 lx (Daylight)": 18000,
    "50000 lx (Direct Sun)": 50000
};

const params = {
    shadows: true,
    exposure: 0.68,
    bulbPower: Object.keys(bulbLuminousPowers)[4],
    hemiIrradiance: Object.keys(hemiLuminousIrradiances)[0]
};

let previousShadowMap = false;
export default function LightPhysical() {

    const modalRef = useRef<{
        camera: THREE.PerspectiveCamera,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        bulbLight: THREE.PointLight,
        bulbMat: THREE.MeshStandardMaterial,
        hemiLight: THREE.HemisphereLight,
        floorMat: THREE.MeshStandardMaterial,
        cubeMat: THREE.MeshStandardMaterial,
        ballMat: THREE.MeshStandardMaterial,
        gui: dat.GUI
    }>({} as any);

    let { camera, scene, renderer, bulbLight, bulbMat, hemiLight, floorMat, cubeMat, ballMat, gui } = modalRef.current;

    useEffect(() => {
        init();
        createPanel();
        animate();
        return () => {
            scene.clear();
            camera.clear()
            renderer.clear();
            gui.destroy();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, .1, 100);
        camera.position.set(-4, 4, 2);

        scene = new THREE.Scene();
        // scene.background = new THREE.Color().setColorName('gray');

        /* 灯泡 */
        const bulbGeometry = new THREE.SphereGeometry(0.02, 16, 8); /* 生成球体的类 */
        bulbLight = new THREE.PointLight(0xffee88, 1, 100, 2);
        bulbMat = new THREE.MeshStandardMaterial({ /* 标准网络材质 */
            emissive: 0xffffee, /* 材质的放射光颜色 */
            emissiveIntensity: 1, /* 放射光强度 */
            color: 0x000000 /* 材质的颜色 */
        });
        bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat)); /* add组合对象 */
        bulbLight.position.set(0, 2, 0);
        bulbLight.castShadow = true; /* 对象是否被渲染到阴影贴图中 */
        scene.add(bulbLight);

        hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.02); /* 半球光 */
        scene.add(hemiLight);

        floorMat = new THREE.MeshStandardMaterial({
            roughness: 0.8, /* 材质的粗糙程度 0-镜面反射 1-完全漫反射 */
            color: 0xffffff, /* 材质颜色 */
            metalness: 0.2, /* 材质与金属的相似度 木材/石材-0 金属-1 */
            bumpScale: 0.0005 /* 凹凸贴图会对材质产生多大的影响 */
        });
        const textureLoader = new THREE.TextureLoader(); /* 加载texture */
        textureLoader.load("/textures/hardwood2_diffuse.jpg", map => {
            map.wrapS = THREE.RepeatWrapping;
            map.wrapT = THREE.RepeatWrapping;
            map.anisotropy = 4;
            map.repeat.set(10, 24);
            map.encoding = THREE.sRGBEncoding;
            floorMat.map = map; /* 颜色贴图 */
            floorMat.needsUpdate = true; /* 指定需要重新编译材质 */
        });
        textureLoader.load("textures/hardwood2_bump.jpg", function (map) {
            map.wrapS = THREE.RepeatWrapping;
            map.wrapT = THREE.RepeatWrapping;
            map.anisotropy = 4;
            map.repeat.set(10, 24);
            floorMat.bumpMap = map; /* 创建凹凸贴图的纹理 */
            floorMat.needsUpdate = true;
        });
        textureLoader.load("textures/hardwood2_roughness.jpg", function (map) {
            map.wrapS = THREE.RepeatWrapping;
            map.wrapT = THREE.RepeatWrapping;
            map.anisotropy = 4;
            map.repeat.set(10, 24);
            floorMat.roughnessMap = map; /* 该纹理的绿色通道用于改变材质的粗糙度。 */
            floorMat.needsUpdate = true;
        });

        cubeMat = new THREE.MeshStandardMaterial({
            roughness: 0.7,
            color: 0xffffff,
            bumpScale: 0.002,
            metalness: 0.2
        });
        textureLoader.load("textures/brick_diffuse.jpg", function (map) {
            map.wrapS = THREE.RepeatWrapping;
            map.wrapT = THREE.RepeatWrapping;
            map.anisotropy = 4;
            map.repeat.set(1, 1);
            map.encoding = THREE.sRGBEncoding;
            cubeMat.map = map;
            cubeMat.needsUpdate = true;
        });
        textureLoader.load("textures/brick_bump.jpg", function (map) {
            map.wrapS = THREE.RepeatWrapping;
            map.wrapT = THREE.RepeatWrapping;
            map.anisotropy = 4;
            map.repeat.set(1, 1);
            cubeMat.bumpMap = map;
            cubeMat.needsUpdate = true;
        });

        ballMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.5,
            metalness: 1.0
        });
        textureLoader.load("textures/planets/earth_atmos_2048.jpg", function (map) {

            map.anisotropy = 4;
            map.encoding = THREE.sRGBEncoding;
            ballMat.map = map;
            ballMat.needsUpdate = true;

        });
        textureLoader.load("textures/planets/earth_specular_2048.jpg", function (map) {

            map.anisotropy = 4;
            map.encoding = THREE.sRGBEncoding;
            ballMat.metalnessMap = map;
            ballMat.needsUpdate = true;

        });

        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMesh = new THREE.Mesh(floorGeometry, floorMat);
        floorMesh.receiveShadow = true;
        floorMesh.rotation.x = - Math.PI / 2.0;
        scene.add(floorMesh);

        const ballGeometry = new THREE.SphereGeometry(0.25, 32, 32);
        const ballMesh = new THREE.Mesh(ballGeometry, ballMat);
        ballMesh.position.set(1, 0.25, 1);
        ballMesh.rotation.y = Math.PI;
        ballMesh.castShadow = true;
        scene.add(ballMesh);

        const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const boxMesh = new THREE.Mesh(boxGeometry, cubeMat);
        boxMesh.position.set(- 0.5, 0.25, - 1);
        boxMesh.castShadow = true;
        scene.add(boxMesh);

        const boxMesh2 = new THREE.Mesh(boxGeometry, cubeMat);
        boxMesh2.position.set(0, 0.25, - 5);
        boxMesh2.castShadow = true;
        scene.add(boxMesh2);

        const boxMesh3 = new THREE.Mesh(boxGeometry, cubeMat);
        boxMesh3.position.set(7, 0.25, 0);
        boxMesh3.castShadow = true;
        scene.add(boxMesh3);

        renderer = new THREE.WebGLRenderer({ canvas });
        renderer.physicallyCorrectLights = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.shadowMap.enabled = true;
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 1;
        controls.maxDistance = 20;
        window.addEventListener('resize', onWindowResize);
    }

    function createPanel() {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        dat.GUI.TEXT_OPEN = '打开Controls';
        gui = new dat.GUI();
        gui.add(params, 'hemiIrradiance', Object.keys(hemiLuminousIrradiances));
        gui.add(params, 'bulbPower', Object.keys(bulbLuminousPowers));
        gui.add(params, 'exposure', 0, 1);
        gui.add(params, 'shadows');
        gui.open();
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        renderer.toneMappingExposure = Math.pow(params.exposure, 5.0); // to allow for very bright scenes.
        renderer.shadowMap.enabled = params.shadows;
        bulbLight.castShadow = params.shadows;

        if (params.shadows !== previousShadowMap) {
            ballMat.needsUpdate = true;
            cubeMat.needsUpdate = true;
            floorMat.needsUpdate = true;
            previousShadowMap = params.shadows;
        }

        bulbLight.power = bulbLuminousPowers[params.bulbPower];
        bulbMat.emissiveIntensity = bulbLight.intensity / Math.pow(0.02, 2.0); // convert from intensity to irradiance at bulb surface

        hemiLight.intensity = hemiLuminousIrradiances[params.hemiIrradiance];
        const time = Date.now() * 0.0005;

        // bulbLight.position.y = Math.cos(time) * 0.75 + 1.25;
        renderer.render(scene, camera);
    }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}