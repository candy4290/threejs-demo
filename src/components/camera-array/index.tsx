import { useEffect, useRef } from "react";
import * as THREE from 'three';

let camera, scene, renderer;
let mesh;
export default function CameraArray() {
    const canvasRef = useRef<HTMLCanvasElement>(null); /* 文本搜索框 */
    useEffect(() => {
        init();
        animate();
    }, []);

    function init() {
        const amount = 6;
        const ASPECT_RATIO = window.innerWidth / window.innerHeight;
        const WIDTH = (window.innerWidth / amount) * window.devicePixelRatio; /* devicePixelRatio设备像素比（设备物理像素与设备独立像素的比例） */
        const HEIGHT = (window.innerHeight / amount) * window.devicePixelRatio;

        const cameras: THREE.PerspectiveCamera[] = [];

        for (let y = 0; y < amount; y++) {
            for (let x = 0; x < amount; x++) {
                const subcamera = new THREE.PerspectiveCamera(40, ASPECT_RATIO, 0.1, 10);
                subcamera['viewport'] = new THREE.Vector4( Math.floor( x * WIDTH ), Math.floor( y * HEIGHT ), Math.ceil( WIDTH ), Math.ceil( HEIGHT ) );
                subcamera.position.x = (x / amount) - 0.5;
                subcamera.position.y = 0.5 - (y / amount);
                subcamera.position.z = 1.5;
                subcamera.position.multiplyScalar(2);
                subcamera.lookAt(0, 0, 0);
                subcamera.updateMatrixWorld();
                cameras.push(subcamera);
            }
        }

        camera = new THREE.ArrayCamera(cameras);
        camera.position.z = 3;

        scene = new THREE.Scene();

        scene.add(new THREE.AmbientLight(0x222244));

        const light = new THREE.DirectionalLight();
        light.position.set(0.5, 0.5, 1);
        light.castShadow = true;
        light.shadow.camera.zoom = 4; // tighter shadow map
        scene.add(light);

        const geometryBackground = new THREE.PlaneGeometry(100, 100);
        const materialBackground = new THREE.MeshPhongMaterial({ color: 0x000066 });

        const background = new THREE.Mesh(geometryBackground, materialBackground);
        background.receiveShadow = true;
        background.position.set(0, 0, - 1);
        scene.add(background);

        const geometryCylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        const materialCylinder = new THREE.MeshPhongMaterial({ color: 0xff0000 });

        mesh = new THREE.Mesh(geometryCylinder, materialCylinder);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        if (canvasRef.current) {
            renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
        }
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
    }

    function animate() {
        mesh.rotation.x += 0.005;
        mesh.rotation.z += 0.01;
        renderer.render( scene, camera );
        requestAnimationFrame( animate );

    }

    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}