import { useEffect, useRef } from "react";
import * as THREE from 'three';

const spherical = new THREE.Spherical();
const rotationMatrix = new THREE.Matrix4();
const targetQuaternion = new THREE.Quaternion();
const clock = new THREE.Clock();
const speed = 2;
export default function OrientationTransform() {
    const threeRef = useRef<{
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        mesh: THREE.Mesh,
        target: THREE.Mesh
    }>({} as any);
    const canvasRef = useRef<HTMLCanvasElement>(null); /* canvas */
    let {scene, camera, renderer, mesh, target} = threeRef.current;

    useEffect(() => {
        init();
        animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.01, 10);
        camera.position.z = 5;

        scene = new THREE.Scene();

        const axesHelper = new THREE.AxesHelper(2000); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        // axesHelper.rotation.y -= 0.01; /* 坐标轴旋转 */
        scene.add(axesHelper);

        const geometry = new THREE.ConeGeometry( 0.1, 0.5, 8 ); /* 圆锥缓冲几何体 */
        geometry.rotateX( Math.PI * 0.5 );
        const material = new THREE.MeshNormalMaterial(); /* 法线网格材质 */
        mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );

        const targetGeometry = new THREE.SphereGeometry( 0.05 ); /* 球缓冲几何体 */
        const targetMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
        target = new THREE.Mesh( targetGeometry, targetMaterial );
        scene.add( target );

        const sphereGeometry = new THREE.SphereGeometry( 2, 32, 32 );
        const sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xcccccc, wireframe: true, transparent: true, opacity: 0.3 } );
        const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
        scene.add( sphere );

        if (canvasRef.current) {
            renderer = new THREE.WebGLRenderer( { antialias: true, canvas: canvasRef.current } );
        }
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );

        generateTarget();
    }

    function animate() {
        requestAnimationFrame( animate );
        const delta = clock.getDelta();
        if ( ! mesh.quaternion.equals( targetQuaternion ) ) {
            const step = speed * delta;
            mesh.quaternion.rotateTowards( targetQuaternion, step );
        }
        renderer.render( scene, camera );
    }

    function generateTarget() {
        // generate a random point on a sphere
        spherical.theta = Math.random() * Math.PI * 2;
        spherical.phi = Math.acos( ( 2 * Math.random() ) - 1 );
        spherical.radius = 2;

        target.position.setFromSpherical( spherical );
        // compute target rotation
        rotationMatrix.lookAt( target.position, mesh.position, mesh.up );
        targetQuaternion.setFromRotationMatrix( rotationMatrix );
        setTimeout( generateTarget, 2000 );
    }

    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}