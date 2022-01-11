import { useEffect } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;

export function VideoDemo() {
    useEffect(() => {
        init();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(20, 20, 20);
        scene.add(camera);

        const light = new THREE.AmbientLight(0xadadad); /* 环境光 */
        scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); /* 平行光源 */
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        renderer = new THREE.WebGLRenderer({
            canvas, antialias: true,
            alpha: true /* canvas是否包含alpha (透明度)。默认为 false */
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(new THREE.Color('#32373E'), 1);

        controls = new MapControls(camera, renderer.domElement);
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2.02;
        controls.screenSpacePanning = false;

        const video = document.getElementById('video') as HTMLVideoElement;
        video.onplay = () => {console.log('播放')}
        document.addEventListener('click', () => {
            video.play();
        })

        const texture = new THREE.VideoTexture(video);

        const gemo = new THREE.PlaneGeometry(10,10);
        const material = new THREE.MeshLambertMaterial({
            map: texture, color: 0xffffff, side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(gemo, material);
        scene.add(mesh);

        const animate = () => {
            requestAnimationFrame(animate)
            renderer.render(scene, camera);
        }
        animate();
    }
    return (
        <div id="parent">
            <canvas id="three" style={{zIndex: 1}}></canvas>

            <video id="video" loop crossOrigin="anonymous" style={{display: 'none'}}>
                <source src="textures/sintel.mp4" type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"' />
		    </video>
        </div>
    )
}