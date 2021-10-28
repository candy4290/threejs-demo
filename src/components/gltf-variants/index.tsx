import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';

const state = { variant: 'midnight' };
export default function GltfVariants() {
    const canvasRef = useRef<HTMLCanvasElement>(null); /* canvas */
    const threejsRef = useRef<{
        camera: THREE.PerspectiveCamera,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        gui: dat.GUI
    }>({} as any);

    let { camera, scene, renderer, gui } = threejsRef.current;

    useEffect(() => {
        init();
    }, []);

    function init() {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
        camera.position.set(2.5, 1.5, 3.0);

        scene = new THREE.Scene();

        if (canvasRef.current) {
            renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current });
        }
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.outputEncoding = THREE.sRGBEncoding;

        new RGBELoader()
            .setDataType(THREE.UnsignedByteType)
            .setPath('/textures/equirectangular/')
            .load('quarry_01_1k.hdr', texture => {
                const envMap = pmremGenerator.fromEquirectangular(texture).texture;

                scene.background = envMap;
                scene.environment = envMap;

                texture.dispose();
                pmremGenerator.dispose();


                const loader = new GLTFLoader().setPath('models/gltf/MaterialsVariantsShoe/glTF/');
                loader.load('MaterialsVariantsShoe.gltf', gltf => {
                    console.log(gltf)
                    gltf.scene.scale.set(10.0, 10.0, 10.0)
                    scene.add(gltf.scene)

                    gui = new dat.GUI();

                    const parser = gltf.parser;
                    const variantsExtension = gltf.userData.gltfExtensions['KHR_materials_variants'];
                    const variants = variantsExtension.variants.map(variant => variant.name);
                    const variantsCtrl = gui.add(state, 'variant', variants).name('Variant');
                    selectVariant(scene, parser, variantsExtension, state.variant);
                    variantsCtrl.onChange((value) => selectVariant(scene, parser, variantsExtension, value));
                })
            });
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.addEventListener('change', render);
        controls.minDistance = 2;
        controls.maxDistance = 10;
        controls.target.set(0, 0.5, - 0.2);
        controls.update();
    }

    function selectVariant(scene, parser, extension, variantName) {

        const variantIndex = extension.variants.findIndex((v) => v.name.includes(variantName));

        scene.traverse(async (object) => {

            if (!object.isMesh || !object.userData.gltfExtensions) return;

            const meshVariantDef = object.userData.gltfExtensions['KHR_materials_variants'];

            if (!meshVariantDef) return;

            if (!object.userData.originalMaterial) {

                object.userData.originalMaterial = object.material;

            }

            const mapping = meshVariantDef.mappings
                .find((mapping) => mapping.variants.includes(variantIndex));
            if (mapping) {

                object.material = await parser.getDependency('material', mapping.material);
                parser.assignFinalMaterial(object);

            } else {

                object.material = object.userData.originalMaterial;

            }

            render();

        });

    }

    function render() {
        renderer.render(scene, camera);
    }
    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}