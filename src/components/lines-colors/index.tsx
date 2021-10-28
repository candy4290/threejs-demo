import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils';

let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
export default function LineColors() {
    const threeRef = useRef<{
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
    }>({} as any);
    const canvasRef = useRef<HTMLCanvasElement>(null); /* canvas */

    let { scene, camera, renderer } = threeRef.current;

    useEffect(() => {
        init();
        animate();
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

        camera = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 1000;

        const hilbertPoints = GeometryUtils.hilbert3D(new THREE.Vector3(0, 0, 0), 200.0, 1, 0, 1, 2, 3, 4, 5, 6, 7); /* 希尔伯曲线 */

        const geometry1 = new THREE.BufferGeometry();

        const subdivisions = 6;

        let vertices: number[] = [];
        let colors1: number[] = [];

        const point = new THREE.Vector3();
        const color = new THREE.Color();

        const spline = new THREE.CatmullRomCurve3(hilbertPoints);

        console.log(hilbertPoints)

        for (let i = 0; i < hilbertPoints.length * subdivisions; i++) {
            const t = i / (hilbertPoints.length * subdivisions);
            spline.getPoint(t, point);

            vertices.push(point.x, point.y, point.z);

            color.setHSL(0.6, 1.0, Math.max(0, - point.x / 200) + 0.5);
            colors1.push(color.r, color.g, color.b);

            color.setHSL(0.9, 1.0, Math.max(0, - point.y / 200) + 0.5);

            color.setHSL(i / (hilbertPoints.length * subdivisions), 1.0, 0.5);
        }

        geometry1.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        geometry1.setAttribute('color', new THREE.Float32BufferAttribute(colors1, 3));

        const geometry4 = new THREE.BufferGeometry();

        vertices = [];
        colors1 = [];

        for (let i = 0; i < hilbertPoints.length; i++) {

            const point = hilbertPoints[i];

            vertices.push(point.x, point.y, point.z);

            color.setHSL(0.6, 1.0, Math.max(0, (200 - hilbertPoints[i].x) / 400) * 0.5 + 0.5);
            colors1.push(color.r, color.g, color.b);

            color.setHSL(0.3, 1.0, Math.max(0, (200 + hilbertPoints[i].x) / 400) * 0.5);

            color.setHSL(i / hilbertPoints.length, 1.0, 0.5);

        }

        geometry4.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        geometry4.setAttribute('color', new THREE.Float32BufferAttribute(colors1, 3));

        var	material = new THREE.LineBasicMaterial( { color: 0xffffff, vertexColors: true } );
        let line, p;
        const scale = 0.3, d = 225;

        const parameters = [
            [ material, scale * 1.5, [ - d, - d / 2, 0 ], geometry1 ],

            [ material, scale * 1.5, [ - d, d / 2, 0 ], geometry4 ],
        ];

        console.log(parameters)

        for ( let i = 0; i < parameters.length; i ++ ) {

            p = parameters[ i ];
            line = new THREE.Line( p[ 3 ], p[ 0 ] );
            line.scale.x = line.scale.y = line.scale.z = p[ 1 ];
            line.position.x = p[ 2 ][ 0 ];
            line.position.y = p[ 2 ][ 1 ];
            line.position.z = p[ 2 ][ 2 ];
            scene.add( line );

        }
    }


    function animate() {

        requestAnimationFrame( animate );
        render();

    }

    function render() {

        camera.position.x += ( mouseX - camera.position.x ) * 0.05;
        camera.position.y += ( - mouseY + 200 - camera.position.y ) * 0.05;

        camera.lookAt( scene.position );

        const time = Date.now() * 0.0005;

        for ( let i = 0; i < scene.children.length; i ++ ) {

            const object: any = scene.children[ i ];

            if ( object.isLine ) {

                object.rotation.y = time * ( i % 2 ? 1 : - 1 );

            }

        }

        renderer.render( scene, camera );

    }
    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}