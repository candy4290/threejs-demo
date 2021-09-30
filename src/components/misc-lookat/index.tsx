import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function MiscLookat() {
    const modalRef = useRef<{
        camera: THREE.PerspectiveCamera,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        sphere: THREE.Mesh,
        mouseX: number,
        mouseY: number
    }>({mouseX: 0, mouseY: 0} as any);

    let { camera, scene, renderer, sphere, mouseX, mouseY } = modalRef.current;

    useEffect(() => {
        init();
        animate();
        return () => {
            camera.clear();
            scene.clear();
            renderer.clear();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 15000);
        camera.position.z = 3200;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        sphere = new THREE.Mesh(new THREE.SphereGeometry(100, 20, 20), new THREE.MeshNormalMaterial());
        scene.add(sphere);

        const geometry = new THREE.CylinderGeometry(0, 10, 100, 12);
        geometry.rotateX(Math.PI / 2);

        const material = new THREE.MeshNormalMaterial();
        for (let i = 0; i < 1000; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = Math.random() * 4000 - 2000;
            mesh.position.y = Math.random() * 4000 - 2000;
            mesh.position.z = Math.random() * 4000 - 2000;
            mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 4 + 2;
            scene.add(mesh);
        }

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
    
    }

    function animate() {
        requestAnimationFrame( animate );
        render();
    }

    function render() {
        const time = Date.now() * 0.0005;
        sphere.position.x = Math.sin( time * 0.7 ) * 2000;
        sphere.position.y = Math.cos( time * 0.5 ) * 2000;
        sphere.position.z = Math.cos( time * 0.3 ) * 2000;
        for ( let i = 1, l = scene.children.length; i < l; i ++ ) {
            scene.children[ i ].lookAt( sphere.position );
        }
        camera.position.x += ( mouseX - camera.position.x ) * .05;
        camera.position.y += ( - mouseY - camera.position.y ) * .05;
        camera.lookAt( scene.position );
        renderer.render( scene, camera );
    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}