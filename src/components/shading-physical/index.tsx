import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import * as dat from 'dat.gui';

const shadowConfig = {
    shadowCameraVisible: false,
    shadowCameraNear: 750,
    shadowCameraFar: 4000,
    shadowBias: - 0.0002
};
const clock = new THREE.Clock();
export default function ShadingPhysical() {
    const threeRef = useRef<{
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        controls: TrackballControls,
        cubeCamera: THREE.CubeCamera,
        mesh: THREE.Mesh,
        mixer: THREE.AnimationMixer,
        ambientLight: THREE.AmbientLight,
        pointLight: THREE.PointLight,
        sunLight: THREE.DirectionalLight,
        gui: dat.GUI,
        shadowCameraHelper: THREE.CameraHelper
    }>({} as any);
    const canvasRef = useRef<HTMLCanvasElement>(null); /* canvas */
    let { scene, camera, renderer, controls, cubeCamera, mesh, mixer, ambientLight, pointLight, sunLight, gui, shadowCameraHelper } = threeRef.current;

    useEffect(() => {
        init();
        createGUI();
        animate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 2, 10000);
        camera.position.set(500, 400, 1200);

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0, 1000, 10000);

        const axesHelper = new THREE.AxesHelper(1000); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        scene.add(axesHelper);

        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            encoding: THREE.sRGBEncoding
        });
        cubeCamera = new THREE.CubeCamera(1, 10000, cubeRenderTarget); /* 立方相机 */

        const textureLoader = new THREE.TextureLoader();
        const textureSquares = textureLoader.load('/textures/patterns/bright_squares256.png');
        textureSquares.repeat = new THREE.Vector2(50, 50);
        textureSquares.wrapS = textureSquares.wrapT = THREE.RepeatWrapping;
        textureSquares.magFilter = THREE.NearestFilter;
        textureSquares.encoding = THREE.sRGBEncoding;

        const textureNoiseColor = textureLoader.load("/textures/disturb.jpg");
        textureNoiseColor.repeat.set(1, 1);
        textureNoiseColor.wrapS = textureNoiseColor.wrapT = THREE.RepeatWrapping;
        textureNoiseColor.encoding = THREE.sRGBEncoding;

        const textureLava = textureLoader.load("/textures/lava/lavatile.jpg");
        textureLava.repeat.set(6, 2);
        textureLava.wrapS = textureLava.wrapT = THREE.RepeatWrapping;
        textureLava.encoding = THREE.sRGBEncoding;

        /* 地面 */
        const groundMaterial = new THREE.MeshPhongMaterial({ /* 具有镜面高光的光泽表面的材质。 */
            shininess: 80, /* 高亮的程度 */
            color: 0xffffff,
            specular: 0xffffff, /* 材质的高光颜色 */
            map: textureSquares
        });
        const planeGeometry = new THREE.PlaneGeometry(100, 100);

        const ground = new THREE.Mesh(planeGeometry, groundMaterial);
        ground.position.set(0, 0, 0);
        ground.rotation.x = - Math.PI / 2;
        ground.scale.set(1000, 1000, 1000);
        ground.receiveShadow = true;
        scene.add(ground);

        // MATERIALS
        const materialLambert = new THREE.MeshPhongMaterial({ shininess: 50, color: 0xffffff, map: textureNoiseColor });
        const materialPhong = new THREE.MeshPhongMaterial({ shininess: 50, color: 0xffffff, specular: 0x999999, map: textureLava });
        const materialPhongCube = new THREE.MeshPhongMaterial({ shininess: 50, color: 0xffffff, specular: 0x999999, envMap: cubeRenderTarget.texture });

        // OBJECTS
        const sphereGeometry = new THREE.SphereGeometry(100, 64, 32); /* 球缓冲几何体 */
        const torusGeometry = new THREE.TorusGeometry(240, 60, 32, 64); /* 圆环缓冲几何体 */
        const cubeGeometry = new THREE.BoxGeometry(150, 150, 150);

        addObject(torusGeometry, materialPhong, 0, 100, 0, 0);
        addObject(cubeGeometry, materialLambert, 350, 75, 300, 0);

        mesh = addObject(sphereGeometry, materialPhongCube, 350, 100, - 350, 0);
        mesh.add(cubeCamera); /* 创建能够反射出场景中其他物体的反光。为了对场景中的其他物体也进行反射 */

        function addObjectColor(geometry, color, x, y, z, ry) {
            const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
            return addObject(geometry, material, x, y, z, ry);
        }

        function addObject(geometry, material, x, y, z, ry) {
            const tmpMesh = new THREE.Mesh(geometry, material);
            tmpMesh.material.color.offsetHSL(0.1, - 0.1, 0);
            tmpMesh.position.set(x, y, z);
            tmpMesh.rotation.y = ry;
            tmpMesh.castShadow = true;
            tmpMesh.receiveShadow = true;
            scene.add(tmpMesh);
            return tmpMesh;
        }

        const bigCube = new THREE.BoxGeometry(50, 500, 50);
        const midCube = new THREE.BoxGeometry(50, 200, 50);
        const smallCube = new THREE.BoxGeometry(100, 100, 100);

        addObjectColor(bigCube, 0xff0000, - 500, 250, 0, 0);
        addObjectColor(smallCube, 0xff0000, - 500, 50, - 150, 0);

        addObjectColor(midCube, 0x00ff00, 500, 100, 0, 0);
        addObjectColor(smallCube, 0x00ff00, 500, 50, - 150, 0);

        addObjectColor(midCube, 0x0000ff, 0, 100, - 500, 0);
        addObjectColor(smallCube, 0x0000ff, - 150, 50, - 500, 0);

        addObjectColor(midCube, 0xff00ff, 0, 100, 500, 0);
        addObjectColor(smallCube, 0xff00ff, - 150, 50, 500, 0);

        addObjectColor(new THREE.BoxGeometry(500, 10, 10), 0xffff00, 0, 600, 0, Math.PI / 4);
        addObjectColor(new THREE.BoxGeometry(250, 10, 10), 0xffff00, 0, 600, 0, 0);

        addObjectColor(new THREE.SphereGeometry(100, 32, 26), 0xffffff, - 300, 100, 300, 0);

        const loader = new GLTFLoader();
        loader.load("/models/gltf/SittingBox.glb", (gltf) => {
            const mesh = gltf.scene.children[0];
            mixer = new THREE.AnimationMixer(mesh);
            mixer.clipAction(gltf.animations[0]).setDuration(10).play();
            const s = 200;
            mesh.scale.set(s, s, s);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
        });

        ambientLight = new THREE.AmbientLight(0x3f2806);
        scene.add(ambientLight);

        pointLight = new THREE.PointLight(0xffaa00, 1, 5000);
        scene.add(pointLight);

        sunLight = new THREE.DirectionalLight(0xffffff, 0.3);
        sunLight.position.set(1000, 2000, 1000);
        sunLight.castShadow = true;
        sunLight.shadow.camera.top = 750;
        sunLight.shadow.camera.bottom = - 750;
        sunLight.shadow.camera.left = - 750;
        sunLight.shadow.camera.right = 750;
        sunLight.shadow.camera.near = shadowConfig.shadowCameraNear;
        sunLight.shadow.camera.far = shadowConfig.shadowCameraFar;
        sunLight.shadow.mapSize.set(1024, 1024);
        sunLight.shadow.bias = shadowConfig.shadowBias;

        scene.add(sunLight);

        // SHADOW CAMERA HELPER
        shadowCameraHelper = new THREE.CameraHelper(sunLight.shadow.camera);
        shadowCameraHelper.visible = shadowConfig.shadowCameraVisible;
        scene.add(shadowCameraHelper);

        if (canvasRef.current) {
            renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current });
        }
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;

        controls = new TrackballControls(camera, renderer.domElement); /* 轨道球控制器 */
        controls.target.set(0, 120, 0);

        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;

        controls.staticMoving = true;

        controls.keys = ['KeyA', 'KeyS', 'KeyD'];
    }

    function createGUI() {
        gui = new dat.GUI({ width: 400 });
        const shadowGUI = gui.addFolder("Shadow");
        shadowGUI.add(shadowConfig, 'shadowCameraVisible').onChange(() => {
            shadowCameraHelper.visible = shadowConfig.shadowCameraVisible;
        });
        shadowGUI.add(shadowConfig, 'shadowCameraNear', 1, 1500).onChange(() => {
            sunLight.shadow.camera.near = shadowConfig.shadowCameraNear;
            sunLight.shadow.camera.updateProjectionMatrix();
            shadowCameraHelper.update();
        });
        shadowGUI.add(shadowConfig, 'shadowCameraFar', 1501, 5000).onChange(() => {
            sunLight.shadow.camera.far = shadowConfig.shadowCameraFar;
            sunLight.shadow.camera.updateProjectionMatrix();
            shadowCameraHelper.update();
        });
        shadowGUI.add(shadowConfig, 'shadowBias', - 0.01, 0.01).onChange(() => {
            sunLight.shadow.bias = shadowConfig.shadowBias;
        });
        shadowGUI.open();
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        const delta = clock.getDelta();
        controls.update();
        if (mixer) {
            mixer.update(delta);
        }
        // render cube map
        mesh.visible = false;
        cubeCamera.update(renderer, scene);
        mesh.visible = true;
        // render scene
        renderer.render(scene, camera);
    }

    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}