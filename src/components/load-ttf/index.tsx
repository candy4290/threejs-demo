import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader';

export default function LoadTtf() {
    const modelRef = useRef<{
        camera: THREE.PerspectiveCamera,
        cameraTarget: THREE.Vector3,
        scene: THREE.Scene,
        material: THREE.MeshPhongMaterial,
        group: THREE.Group,
        font: THREE.Font,
        textGeo: THREE.TextGeometry,
        textMesh1: THREE.Mesh,
        textMesh2: THREE.Mesh,
        renderer: THREE.WebGLRenderer,
        windowHalfX: number,
        targetRotation: number,
        targetRotationOnPointerDown: number,
        pointerX: number,
        pointerXOnPointerDown: number,
        text: string,
        firstLetter: boolean
    }>({ windowHalfX: window.innerWidth / 2, targetRotation: 0, pointerXOnPointerDown: 0, targetRotationOnPointerDown: 0, pointerX: 0, text: 'KAIZHI', firstLetter: true } as any);

    let { camera, cameraTarget, scene, material, group, font, textGeo, textMesh1, textMesh2, renderer, windowHalfX, targetRotation
        , targetRotationOnPointerDown, pointerXOnPointerDown, pointerX, text, firstLetter } = modelRef.current;

    useEffect(() => {
        init();
        animate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
        camera.position.set(0, 400, 700);
        cameraTarget = new THREE.Vector3(0, 150, 0);

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 250, 1400);

        const axesHelper = new THREE.AxesHelper(1000); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        scene.add(axesHelper);


        const pointLight = new THREE.PointLight(0xffffff, 1.5); /* 1.5-光照强度 */
        pointLight.position.set(0, 100, 90);
        pointLight.color.setHSL(0.5, 1, 0.5);
        scene.add(pointLight);
        const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
        scene.add(pointLightHelper);

        material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }); /* 具有镜面光泽的材质 flatShading-是否使用平面着色进行渲染 */

        group = new THREE.Group();
        group.position.y = 100;
        scene.add(group);

        const loader = new TTFLoader();
        loader.load('/fonts/ttf/kenpixel.ttf', json => {
            font = new THREE.Font(json);
            createText();
        });

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(10000, 10000),
            new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
        );
        plane.position.y = 100;
        plane.rotation.x = - Math.PI / 2;
        scene.add(plane);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        canvas.style.touchAction = 'none';
        canvas.addEventListener('pointerdown', onPointerDown);

        document.addEventListener('keypress', onDocumentKeyPress);
        document.addEventListener('keydown', onDocumentKeyDown);

        window.addEventListener('resize', onWindowResize);
    }

    function onDocumentKeyPress(event) {
        console.log('keypress')
        const keyCode = event.which;
        // backspace
        if (keyCode === 8) {
            event.preventDefault();
        } else {
            const ch = String.fromCharCode(keyCode);
            text += ch;
            refreshText();
        }
    }

    function onDocumentKeyDown(event) {
        console.log('keydown')
        if (firstLetter) {
            firstLetter = false;
            text = '';
        }
        const keyCode = event.keyCode;
        // backspace
        if (keyCode === 8) {
            event.preventDefault();
            text = text.substring(0, text.length - 1);
            refreshText();
            return false;
        }

    }

    function refreshText() {
        group.remove(textMesh1);
        group.remove(textMesh2);
        if (!text) return;
        createText();
    }

    function onPointerDown(event) {

        if (event.isPrimary === false) return;

        pointerXOnPointerDown = event.clientX - windowHalfX;
        targetRotationOnPointerDown = targetRotation;

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);

    }

    function onPointerMove(event) {

        if (event.isPrimary === false) return;

        pointerX = event.clientX - windowHalfX;

        targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;

    }

    function onPointerUp(event) {

        if (event.isPrimary === false) return;

        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);

    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        group.rotation.y += (targetRotation - group.rotation.y) * 0.05;
        camera.lookAt(cameraTarget);
        renderer.render(scene, camera);
    }

    function createText() {
        textGeo = new THREE.TextGeometry(text, {
            font,
            size: 70,
            height: 20,
            curveSegments: 4,
            bevelThickness: 2,
            bevelSize: 1.5
        });
        textGeo.computeBoundingBox();
        textGeo.computeVertexNormals();
        let centerOffset: number;
        if (textGeo.boundingBox) {
            centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
            textMesh1 = new THREE.Mesh(textGeo, material);
            textMesh1.position.x = centerOffset;
            textMesh1.position.y = 30;
            textMesh1.position.z = 0;
            textMesh1.rotation.x = 0;
            textMesh1.rotation.y = Math.PI * 2;
            group.add(textMesh1)

            textMesh2 = new THREE.Mesh(textGeo, material);
            textMesh2.position.x = centerOffset;
            textMesh2.position.y = - 30;
            textMesh2.position.z = 20;
            textMesh2.rotation.x = Math.PI;
            textMesh2.rotation.y = Math.PI * 2;
            group.add(textMesh2);
        }



    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}