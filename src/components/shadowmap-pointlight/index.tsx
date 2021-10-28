import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function ShadowmapPointLight() {
    const threeRef = useRef<{
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        pointLight: THREE.PointLight,
        pointLight2: THREE.PointLight,
    }>({} as any);
    const canvasRef = useRef<HTMLCanvasElement>(null); /* canvas */
    let { scene, camera, renderer, pointLight, pointLight2 } = threeRef.current;

    useEffect(() => {
        init();
        animate();
    }, []);

    function init() {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.set(0, 10, 40);

        scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0x111122));

        pointLight = createLight(0x0088ff);
        scene.add(pointLight);

        pointLight2 = createLight(0xff8888);
        scene.add(pointLight2);

        const geometry = new THREE.BoxGeometry(30, 30, 30);

        const material = new THREE.MeshPhongMaterial({
            color: 0xa0adaf,
            shininess: 10, /* 高光程度 */
            specular: 0x111111, /* 高光颜色 */
            side: THREE.BackSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 10;
        mesh.receiveShadow = true;
        scene.add(mesh);

        if (canvasRef.current) {
            renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current });
        }
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.BasicShadowMap;

        const controls = new OrbitControls( camera, renderer.domElement );
        controls.target.set( 0, 10, 0 );
        controls.update();
    }

    function animate() {
        requestAnimationFrame( animate );
        render();
    }

    function render() {
        let time = performance.now() * 0.001;

        pointLight.position.x = Math.sin( time * 0.6 ) * 9;
        pointLight.position.y = Math.sin( time * 0.7 ) * 9 + 6;
        pointLight.position.z = Math.sin( time * 0.8 ) * 9;

        pointLight.rotation.x = time;
        pointLight.rotation.z = time;

        time += 10000;

        pointLight2.position.x = Math.sin( time * 0.6 ) * 9;
        pointLight2.position.y = Math.sin( time * 0.7 ) * 9 + 6;
        pointLight2.position.z = Math.sin( time * 0.8 ) * 9;

        pointLight2.rotation.x = time;
        pointLight2.rotation.z = time;

        renderer.render( scene, camera );
    }

    /* 创建光 */
    function createLight(color: any) {
        const intensity = 1.5;

        const light = new THREE.PointLight(color, intensity, 20);
        light.castShadow = true;
        light.shadow.bias = -0.005;

        let geometry = new THREE.SphereGeometry(0.3, 12, 6); /* 球缓冲几何体 */
        let material = new THREE.MeshBasicMaterial({ color });
        material.color.multiplyScalar(intensity);
        let sphere = new THREE.Mesh(geometry, material);
        light.add(sphere);

        const texture = new THREE.CanvasTexture(generateTexture());
        texture.magFilter = THREE.NearestFilter;
        texture.wrapT = THREE.RepeatWrapping;
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.set(1, 4.5);

        geometry = new THREE.SphereGeometry(2, 32, 8);
        material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            alphaMap: texture,
            alphaTest: 0.5
        });
        sphere = new THREE.Mesh(geometry, material);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        light.add(sphere);

        // custom distance material
        const distanceMaterial = new THREE.MeshDistanceMaterial({
            alphaMap: material.alphaMap,
            alphaTest: material.alphaTest
        });
        sphere.customDistanceMaterial = distanceMaterial;
        return light;
    }

    function generateTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 2;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = 'white';
            context.fillRect(0, 1, 2, 1);
        }
        return canvas;
    }
    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}