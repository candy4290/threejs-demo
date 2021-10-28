import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from 'dat.gui';

export default function SpotLight() {
    const threeRef = useRef<{
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        spotLight: THREE.SpotLight,
        lightHelper: THREE.SpotLightHelper,
        shadowCameraHelper: THREE.CameraHelper,
        gui: dat.GUI,
    }>({} as any);
    const canvasRef = useRef<HTMLCanvasElement>(null); /* canvas */

    let { scene, camera, renderer, spotLight, lightHelper, shadowCameraHelper, gui } = threeRef.current;

    useEffect(() => {
        init();
        buildGUI();
    }, []);

    function init() {
        if (canvasRef.current) {
            renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
        }
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        renderer.shadowMap.enabled = true;

        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.set(160, 40, 10);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.addEventListener('change', render);
        controls.minDistance = 20;
        controls.maxDistance = 500;
        controls.enablePan = false;

        const ambient = new THREE.AmbientLight(0xffffff, 0.1);
        scene.add(ambient);

        spotLight = new THREE.SpotLight(0xffffff, 1);
        spotLight.position.set(15, 40, 35);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.1; /* 聚光锥的半影衰减百分比 */
        spotLight.decay = 2; /* 沿着光照距离的衰减量 */
        spotLight.distance = 200; /* 如果非零，那么光强度将会从最大值当前灯光位置处按照距离线性衰减到0 */

        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 512;
        spotLight.shadow.mapSize.height = 512;
        spotLight.shadow.camera.near = 10;
        spotLight.shadow.camera.far = 200;
        spotLight.shadow.focus = 1;
        scene.add(spotLight);

        const axesHelper = new THREE.AxesHelper(2000); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        // axesHelper.rotation.y -= 0.01; /* 坐标轴旋转 */
        scene.add(axesHelper);

        lightHelper = new THREE.SpotLightHelper(spotLight);
        scene.add(lightHelper);

        shadowCameraHelper = new THREE.CameraHelper(spotLight.shadow.camera);
        scene.add(shadowCameraHelper);

        let material = new THREE.MeshPhongMaterial({ color: 0x808080, dithering: true });

        let geometry: THREE.PlaneGeometry | THREE.CylinderGeometry = new THREE.PlaneGeometry(2000, 2000);

        let mesh: THREE.Mesh<THREE.PlaneGeometry | THREE.CylinderGeometry, THREE.MeshPhongMaterial> = new THREE.Mesh(geometry, material);
        mesh.position.set(0, - 1, 0);
        mesh.rotation.x = - Math.PI * 0.5;
        mesh.receiveShadow = true;
        scene.add(mesh);

        material = new THREE.MeshPhongMaterial({ color: 0x4080ff, dithering: true });

        geometry = new THREE.CylinderGeometry(5, 5, 2, 32, 1, false);

        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 5, 0);
        mesh.castShadow = true;
        scene.add(mesh);

        render();

        window.addEventListener('resize', onWindowResize);
    }

    function buildGUI() {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        gui = new dat.GUI();
        dat.GUI.TEXT_OPEN = '打开Controls';
        const params = {
            'light color': spotLight.color.getHex(),
            intensity: spotLight.intensity,
            distance: spotLight.distance,
            angle: spotLight.angle,
            penumbra: spotLight.penumbra,
            decay: spotLight.decay,
            focus: spotLight.shadow.focus
        };

        gui.addColor(params, 'light color').onChange(val => {
            spotLight.color.setHex(val);
            render();
        });

        gui.add(params, 'intensity', 0, 2).onChange(val => {
            spotLight.intensity = val;
            render();
        });


        gui.add(params, 'distance', 50, 200).onChange(val => {
            spotLight.distance = val;
            render();
        });

        gui.add(params, 'angle', 0, Math.PI / 3).onChange(val => {
            spotLight.angle = val;
            render();
        });

        gui.add(params, 'penumbra', 0, 1).onChange(val => {
            spotLight.penumbra = val;
            render();
        });

        gui.add(params, 'decay', 1, 2).onChange(val => {
            spotLight.decay = val;
            render();
        });

        gui.add(params, 'focus', 0, 1).onChange(val => {
            spotLight.shadow.focus = val;
            render();
        });

        gui.open();
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function render() {
        lightHelper.update();
        shadowCameraHelper.update();
        renderer.render(scene, camera);
    }
    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}