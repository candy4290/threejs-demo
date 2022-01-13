import { useEffect } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;

export default function Lod() {
    
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
        directionalLight.position.set(100, 100, 0);
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
        controls.target.set(2, 0, 0);

        scene.add(new THREE.AxesHelper(10));

        const geometry: any = [

            [ new THREE.IcosahedronGeometry( 100, 16 ), 5 ],
            [ new THREE.IcosahedronGeometry( 100, 8 ), 30 ],
            [ new THREE.IcosahedronGeometry( 100, 4 ), 100 ],
            [ new THREE.IcosahedronGeometry( 100, 2 ), 200 ],
            [ new THREE.IcosahedronGeometry( 100, 1 ), 300 ]

        ];

        const material = new THREE.MeshLambertMaterial( { color: 0xffffff, wireframe: true } );

        const lod = new THREE.LOD();
        for( let i = 0; i < 3; i++ ) {
             const geometry = new THREE.IcosahedronGeometry( 10, 3 - i ) 
             const mesh = new THREE.Mesh( geometry, material );
              lod.addLevel( mesh, i * 75 );
        } scene.add( lod );

        const animate = () => {
            requestAnimationFrame(animate)
            renderer.render(scene, camera);
        }

        animate();
    }

    return (
        <div id="parent">
            <canvas id="three"></canvas>
        </div>
    )
}