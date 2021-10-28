import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';

/**
 * 平面光光源从一个矩形平面上均匀地发射光线。这种光源可以用来模拟像明亮的窗户或者条状灯光光源。
 *
 * @export
 * @return {*} 
 */
export default function RectAreaLight() {
    const threeRef = useRef<{
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
    }>({} as any);
    const canvasRef = useRef<HTMLCanvasElement>(null); /* canvas */

    let { scene, camera, renderer } = threeRef.current;

    useEffect(() => {
        init();
    }, []);

    function init() {
        if (canvasRef.current) {
            renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
        }
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animation);
        renderer.outputEncoding = THREE.sRGBEncoding;

        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
        camera.position.set( 0, 5, - 15 );

        scene = new THREE.Scene();

        RectAreaLightUniformsLib.init();

        const rectLight1 = new THREE.RectAreaLight( 0xff0000, 5, 4, 10 );
        rectLight1.position.set( - 5, 5, 5 );
        scene.add( rectLight1 );

        const rectLight2 = new THREE.RectAreaLight( 0x00ff00, 5, 4, 10 );
        rectLight2.position.set( 0, 5, 5 );
        scene.add( rectLight2 );

        const rectLight3 = new THREE.RectAreaLight( 0x0000ff, 5, 4, 10 );
        rectLight3.position.set( 5, 5, 5 );
        scene.add( rectLight3 );

        scene.add( new RectAreaLightHelper( rectLight1 ) );
        scene.add( new RectAreaLightHelper( rectLight2 ) );
        scene.add( new RectAreaLightHelper( rectLight3 ) );

        const geoFloor = new THREE.BoxGeometry( 2000, 0.1, 2000 );
        const matStdFloor = new THREE.MeshStandardMaterial( { color: 0x808080, roughness: 0.1, metalness: 0 } );
        const mshStdFloor = new THREE.Mesh( geoFloor, matStdFloor );
        scene.add( mshStdFloor );

        const geoKnot = new THREE.TorusKnotGeometry( 1.5, 0.5, 200, 16 );
        const matKnot = new THREE.MeshStandardMaterial( { color: 0xffffff, roughness: 0, metalness: 0 } );
        const meshKnot = new THREE.Mesh( geoKnot, matKnot );
        meshKnot.name = 'meshKnot';
        meshKnot.position.set( 0, 5, 0 );
        scene.add( meshKnot );

        const controls = new OrbitControls( camera, renderer.domElement );
        controls.target.copy( meshKnot.position );
        controls.update();

        window.addEventListener( 'resize', onWindowResize );
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animation(time) {
        const mesh: any = scene.getObjectByName( 'meshKnot' );
        mesh.rotation.y = time / 1000;

        renderer.render( scene, camera );

    }
    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}