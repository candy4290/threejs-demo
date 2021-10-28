import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler';

const count = 2000;
const ages = new Float32Array(count);
const scales = new Float32Array(count);
const dummy = new THREE.Object3D();

const _position = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _scale = new THREE.Vector3();

// Source: https://gist.github.com/gre/1650294
const easeOutCubic = function (t) {
    return (--t) * t * t + 1;
};

// Scaling curve causes particles to grow quickly, ease gradually into full scale, then
// disappear quickly. More of the particle's lifetime is spent around full scale.
const scaleCurve = function (t) {
    return Math.abs(easeOutCubic((t > 0.5 ? 1 - t : t) * 2));
};

export default function InstancingScatter() {
    const threeRef = useRef<{
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        stemGeometry: THREE.BufferGeometry,
        blossomGeometry: THREE.BufferGeometry,
        stemMaterial: THREE.Material | THREE.Material[],
        blossomMaterial: THREE.Material | THREE.Material[],
        stemMesh: THREE.InstancedMesh,
        blossomMesh: THREE.InstancedMesh,
        surface: THREE.Mesh,
        sampler: MeshSurfaceSampler,
    }>({} as any);
    const canvasRef = useRef<HTMLCanvasElement>(null); /* canvas */

    let { stemGeometry, blossomGeometry, stemMaterial, blossomMaterial, stemMesh, blossomMesh, surface, sampler, renderer, scene, camera } = threeRef.current;

    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const surfaceGeometry = new THREE.TorusKnotGeometry(10, 3, 100, 16).toNonIndexed();
        const surfaceMaterial = new THREE.MeshLambertMaterial({ color: 0xFFF784, wireframe: false });
        surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);

        if (canvasRef.current) {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xe0e0e0);

            renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.outputEncoding = THREE.sRGBEncoding;

            // const axesHelper = new THREE.AxesHelper(1000); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
            // scene.add(axesHelper);

            const dirLight = new THREE.AmbientLight(0xffffff);
            scene.add(dirLight);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(25, 25, 25);
            camera.lookAt(0, 0, 0);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            scene.add(directionalLight);

            const loader = new GLTFLoader();
            loader.load('/models/gltf/Flower/Flower.glb', gltf => {
                console.log(gltf);
                const _stemMesh = gltf.scene.getObjectByName('Stem') as THREE.Mesh; /* 茎 */
                const _blossomMesh = gltf.scene.getObjectByName('Blossom') as THREE.Mesh; /* 花朵 */
                stemGeometry = _stemMesh.geometry.clone();
                blossomGeometry = _blossomMesh.geometry.clone();

                const defaultTransform = new THREE.Matrix4().makeRotationX(Math.PI).multiply(new THREE.Matrix4().makeScale(7, 7, 7));

                stemGeometry.applyMatrix4(defaultTransform);
                blossomGeometry.applyMatrix4(defaultTransform);

                stemMaterial = _stemMesh.material;
                blossomMaterial = _blossomMesh.material;

                stemMesh = new THREE.InstancedMesh(stemGeometry, stemMaterial, count);
                blossomMesh = new THREE.InstancedMesh(blossomGeometry, blossomMaterial, count);

                const color = new THREE.Color();
                const blossomPalette = [0xF20587, 0xF2D479, 0xF2C879, 0xF2B077, 0xF24405];

                for (let i = 0; i < count; i++) {
                    color.setHex(blossomPalette[Math.floor(Math.random() * blossomPalette.length)]);
                    blossomMesh.setColorAt(i, color);
                }

                stemMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                blossomMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

                scene.add(stemMesh);
                scene.add(blossomMesh);

                scene.add(surface);

                resample();

                animate();
            })

        }

    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function updateParticle(i) {
        // Update lifecycle.
        ages[i] += 0.005;
        if (ages[i] >= 1) {
            ages[i] = 0.001;
            scales[i] = scaleCurve(ages[i]);
            resampleParticle(i);
            return;
        }
        // Update scale.
        const prevScale = scales[i];
        scales[i] = scaleCurve(ages[i]);
        _scale.set(scales[i] / prevScale, scales[i] / prevScale, scales[i] / prevScale);
        // Update transform.
        stemMesh.getMatrixAt(i, dummy.matrix);
        dummy.matrix.scale(_scale);
        stemMesh.setMatrixAt(i, dummy.matrix);
        blossomMesh.setMatrixAt(i, dummy.matrix);
    }

    function render() {
        if (stemMesh && blossomMesh) {
            for (let i = 0; i < count; i++) {
                updateParticle(i);
            }
            stemMesh.instanceMatrix.needsUpdate = true;
            blossomMesh.instanceMatrix.needsUpdate = true;
        }
        renderer.render(scene, camera);
    }

    function resample() {
        const vertexCount = surface.geometry.getAttribute('position').count;
        console.info('Sampling ' + count + ' points from a surface with ' + vertexCount + ' vertices...');
        console.time('.build()');
        sampler = new MeshSurfaceSampler(surface).setWeightAttribute(null).build();
        console.timeEnd('.build()');
        console.time('.sample()');

        for (let i = 0; i < count; i++) {
            ages[i] = Math.random();
            scales[i] = scaleCurve(ages[i]);
            resampleParticle(i);
        }
        console.timeEnd('.sample()');
        stemMesh.instanceMatrix.needsUpdate = true;
        blossomMesh.instanceMatrix.needsUpdate = true;
    }

    function resampleParticle(i) {
        sampler.sample(_position, _normal);
        _normal.add(_position);

        dummy.position.copy(_position);
        dummy.scale.set(scales[i], scales[i], scales[i]);
        dummy.lookAt(_normal);
        dummy.updateMatrix();

        stemMesh.setMatrixAt(i, dummy.matrix);
        blossomMesh.setMatrixAt(i, dummy.matrix);
    }

    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}