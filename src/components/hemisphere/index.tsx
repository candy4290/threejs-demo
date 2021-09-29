import { useEffect, useRef } from "react"
import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function HemisphereLight() {
    const modelRef = useRef<{
        camera: THREE.PerspectiveCamera,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        mixers: THREE.AnimationMixer[],
        clock: THREE.Clock,
        hemiLight: THREE.HemisphereLight,
        hemiLightHelper: THREE.HemisphereLightHelper,
        dirLight: THREE.DirectionalLight,
        dirLightHelper: THREE.DirectionalLightHelper
    }>({ mixers: [], clock: new THREE.Clock() } as any);
    let { camera, scene, renderer, mixers, clock, hemiLight, dirLight, hemiLightHelper, dirLightHelper } = modelRef.current;

    useEffect(() => {
        init();
        animate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        /* 相机 */
        camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 5000);
        camera.position.set(0, 0, 250);

        /* 场景 */
        scene = new THREE.Scene();
        scene.background = new THREE.Color().setHSL(.6, 0, 1);

        /* 光 */
        hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, .6); /* 半球光-光源直接放置于场景之上，光照颜色从天空光线颜色渐变至地面光线颜色 */
        hemiLight.color.setHSL(.6, 1, .6); /* 天空发出的光线颜色 */
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 50, 0);
        scene.add(hemiLight);

        hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
        scene.add(hemiLightHelper);

        dirLight = new THREE.DirectionalLight(0xffffff, 1); /* 平行光 */
        dirLight.color.setHSL(0.1, 1, 0.95);
        dirLight.position.set(- 1, 1.75, 1);
        dirLight.position.multiplyScalar(30);
        scene.add(dirLight);

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        const d = 50;

        dirLight.shadow.camera.left = - d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = - d;

        dirLight.shadow.camera.far = 3500;
        dirLight.shadow.bias = - 0.0001;

        dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
        scene.add(dirLightHelper);

        /* 地面 */
        const groundGeo = new THREE.PlaneGeometry(10000, 10000);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        groundMat.color.setHSL(0.095, 1, 0.75);

        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.y = - 33;
        ground.rotation.x = - Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        /* 天空 */
        const vertexShader = `
            varying vec3 vWorldPosition;
			void main() {
				vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
				vWorldPosition = worldPosition.xyz;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}
        `;

        const fragmentShader = `
            uniform vec3 topColor;
			uniform vec3 bottomColor;
			uniform float offset;
			uniform float exponent;

			varying vec3 vWorldPosition;

			void main() {

				float h = normalize( vWorldPosition + offset ).y;
				gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );

			}
        `;

        const uniforms = {
            "topColor": { value: new THREE.Color(0x0077ff) },
            "bottomColor": { value: new THREE.Color(0xffffff) },
            "offset": { value: 33 },
            "exponent": { value: 0.6 }
        };
        uniforms["topColor"].value.copy(hemiLight.color);

        scene.fog?.color.copy(uniforms["bottomColor"].value);

        const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        scene.add(sky);

        const loader = new GLTFLoader();
        loader.load('/glbs/Flamingo.glb', function (gltf) {
            const mesh = gltf.scene.children[0];
            const s = 0.35;
            mesh.scale.set(s, s, s);
            mesh.position.y = 15;
            mesh.rotation.y = - 1;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(gltf.scene);
            const mixer = new THREE.AnimationMixer(mesh);
            mixer.clipAction(gltf.animations[0]).setDuration(1).play();
            mixers.push(mixer);
        });

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.shadowMap.enabled = true;

        window.addEventListener('resize', onWindowResize);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        for (let i = 0; i < mixers.length; i++) {
            mixers[i].update(delta);
        }
        renderer.render(scene, camera);
    }

    function toggleHemisphere() {
        hemiLight.visible = !hemiLight.visible;
        hemiLightHelper.visible = !hemiLightHelper.visible;
    }

    function toggleDirectional() {
        dirLight.visible = !dirLight.visible;
        dirLightHelper.visible = !dirLightHelper.visible;
    }

    return (
        <>
            <canvas id="three"></canvas>
            <button id="hemisphereButton" style={{position: 'absolute', right: 108, zIndex: 1, color: '#000'}} onClick={toggleHemisphere}>切换半球光</button>
			<button id="directionalButton" style={{position: 'absolute', right: 8, zIndex: 1, color: '#000'}} onClick={toggleDirectional}>切换平行光</button>
        </>
    )
}