import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { Flow } from 'three/examples/jsm/modifiers/CurveModifier';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

const ACTION_SELECT = 1, ACTION_NONE = 0;
const curveHandles: THREE.Mesh[] = [];
const mouse = new THREE.Vector2();
export default function ModifierCurve() {
    const threeRef = useRef<{
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        flow: Flow,
        rayCaster: THREE.Raycaster,
        control: TransformControls,
        action: number
    }>({ action: ACTION_NONE } as any);
    const canvasRef = useRef<HTMLCanvasElement>(null); /* canvas */
    let { scene, camera, renderer, flow, rayCaster, control, action } = threeRef.current;

    useEffect(() => {
        init();
        animate();
    }, []);

    function init() {
        scene = new THREE.Scene();

        const axesHelper = new THREE.AxesHelper(50); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        scene.add(axesHelper);

        camera = new THREE.PerspectiveCamera(
            40,
            window.innerWidth / window.innerHeight,
            1,
            1000
        );
        camera.position.set(2, 2, 4);
        camera.lookAt(scene.position);

        const initialPoints = [
            { x: 1, y: 0, z: - 1 },
            { x: 1, y: 0, z: 1 },
            { x: - 1, y: 0, z: 1 },
            { x: - 1, y: 0, z: - 1 },
        ];

        const boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const boxMaterial = new THREE.MeshBasicMaterial();

        for (const handlePos of initialPoints) {
            const handle = new THREE.Mesh(boxGeometry, boxMaterial);
            handle.position.copy(handlePos as THREE.Vector3);
            curveHandles.push(handle);
            scene.add(handle);
        }

        const curve = new THREE.CatmullRomCurve3(
            curveHandles.map((handle) => handle.position)
        , true, 'centripetal');

        const points = curve.getPoints(50);
        const line = new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: 0x00ff00 })
        );

        scene.add(line);

        const light = new THREE.DirectionalLight(0xffaa33);
        light.position.set(- 10, 10, 10);
        light.intensity = 1.0;
        scene.add(light);

        const light2 = new THREE.AmbientLight(0x003973);
        light2.intensity = 1.0;
        scene.add(light2);

        const loader = new THREE.FontLoader();
        loader.load('fonts/helvetiker_regular.typeface.json', function (font) {

            const geometry = new THREE.TextGeometry('Hello three.js!', {
                font: font,
                size: 0.2,
                height: 0.05,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.01,
                bevelOffset: 0,
                bevelSegments: 5,
            });

            geometry.rotateX(Math.PI);

            const material = new THREE.MeshStandardMaterial({
                color: 0x99ffff
            });

            const objectToCurve = new THREE.Mesh(geometry, material);

            flow = new Flow(objectToCurve);
            flow.updateCurve(0, curve);
            scene.add(flow.object3D);

        });

        if (canvasRef.current) {
            renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current });
        }
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.addEventListener( 'pointerdown', onPointerDown );

        rayCaster = new THREE.Raycaster();
        control = new TransformControls(camera, renderer.domElement);
        control.addEventListener('dragging-changed', function (event) {

            if (!event.value) {

                const points = curve.getPoints(50);
                line.geometry.setFromPoints(points);
                flow.updateCurve(0, curve);

            }

        });

    }

    function onPointerDown(event) {
        action = ACTION_SELECT;
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

    function animate() {
        requestAnimationFrame(animate);
        if (action === ACTION_SELECT) {
            rayCaster.setFromCamera(mouse, camera);
            action = ACTION_NONE;
            const intersects = rayCaster.intersectObjects(curveHandles);
            if (intersects.length) {
                const target = intersects[0].object;
                control.attach(target);
                scene.add(control);
            }
        }
        if (flow) {
            flow.moveAlongCurve(0.001);
        }
        render();
    }

    function render() {
        renderer.render(scene, camera);
    }
    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}