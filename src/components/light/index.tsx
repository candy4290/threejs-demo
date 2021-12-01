import { useEffect } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * 自定义着色器实现海水效果
 *
 * @export
 */
export default function Light() {
    useEffect(() => {
        init();
    }, []);
    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
        renderer.setClearColor(0x8d8d8d, 1);
        renderer.setSize(window.innerWidth, window.innerHeight);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        camera.position.set(0, 0, 360);
        scene.add(camera);

        let light = new THREE.PointLight(0xffffff, 0.8); // white light
        light.position.set(30, 100, 50);
        scene.add(light);

        let geometry = new THREE.TorusGeometry(10, 3, 16, 100);
        let materialT = new THREE.MeshPhongMaterial({
            color: 0x00ff00
        });
        let object = new THREE.Mesh(geometry, materialT);
        let glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                viewVector: {
                    type: "v3",
                    value: camera.position
                } as any
            },
            vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );
                vec3 actual_normal = vec3(modelMatrix * vec4(normal, 0.0));
                intensity = pow( dot(normalize(viewVector), actual_normal), 6.0 );
            }
            `,
            fragmentShader: `
            varying float intensity;
            void main() {
                vec3 glow = vec3(0, 1, 0) * intensity;
                gl_FragColor = vec4( glow, 1.0 );
            }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        let glowGeometry = new THREE.TorusGeometry(10, 5, 16, 100);

        let glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        object.add(glowMesh);
        // object['glow'] = glowMesh;
        scene.add(object);

        const controls = new OrbitControls( camera, renderer.domElement );
        controls.target.set( 0, 0, 0 );
        controls.update();

        function update() {
            // let viewVector = new THREE.Vector3().subVectors(camera.position, object['glow'].getWorldPosition(new THREE.Vector3(1,1,1)));
            // object['glow'].material.uniforms.viewVector.value = viewVector;
            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        
    }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}