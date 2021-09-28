import { useEffect } from "react"
import * as THREE from 'three';
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { KMZLoader } from 'three/examples/jsm/loaders/KMZLoader.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function Kmz() {
    useEffect(() => {
        create();
    }, []);

    function create() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        const renderer = new THREE.WebGLRenderer({antialias: true, canvas}); /* 创建渲染器 */
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize( window.innerWidth, window.innerHeight );

        const scene = new THREE.Scene(); /* 创建场景 */
        scene.background = new THREE.Color(0x999999);
        const light = new THREE.DirectionalLight( 0xffffff ); /* 平行光-用来模拟太阳光 */
        light.position.set( 0.5, 1.0, 0.5 ).normalize();

        scene.add(light);

        const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 500); /* 透视相机 */
        camera.position.y = 5;
        camera.position.z = 10;
        scene.add(camera);

        const grid = new THREE.GridHelper( 50, 50, 0xffffff, 0x555555 ); /* 做表格辅助对象 */
        scene.add( grid );

        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        const loader = new KMZLoader();

        loader.load( '/kmz/Box.kmz', function ( kmz ) {
            kmz.scene.position.y = 0.5;
            scene.add( kmz.scene );
            render();
        } );

        const controls = new OrbitControls( camera, renderer.domElement );
        controls.addEventListener( 'change', render );
        controls.update();


        window.addEventListener( 'resize', onWindowResize );

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize( window.innerWidth, window.innerHeight );
            render();
        }

        function render() {
            renderer.render( scene, camera );
        }
    }

    return (
        <canvas id="three"></canvas>
    )
}