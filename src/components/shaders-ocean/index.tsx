import { useEffect } from "react"
import * as THREE from 'three';
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function ShadersOcean() {
    useEffect(() => {
        create();
    }, []);

    function create() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        const renderer = new THREE.WebGLRenderer({canvas}); /* 创建渲染器 */
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.toneMapping = THREE.ACESFilmicToneMapping; /* 色调映射 */

        const scene = new THREE.Scene(); /* 创建场景 */
        const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000); /* 透视相机 */
        camera.position.set( 30, 30, 100 );

        const axesHelper = new THREE.AxesHelper(5); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        // axesHelper.rotation.y -= 0.01; /* 坐标轴旋转 */
        scene.add(axesHelper);

        const sun = new THREE.Vector3(); /* 太阳 */

        const waterGeometry = new THREE.PlaneGeometry(10000, 10000); /* 水 */
        const water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load( 'textures/waternormals.jpg', function ( texture ) {

                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            } ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        });
        water.rotation.x = - Math.PI / 2;

        scene.add( water );

        /* 天空 */
        const sky = new Sky();
        sky.scale.setScalar( 10000 );
        scene.add( sky );

        const skyUniforms = sky.material.uniforms;
        skyUniforms[ 'turbidity' ].value = 10;
        skyUniforms[ 'rayleigh' ].value = 2;
        skyUniforms[ 'mieCoefficient' ].value = 0.005;
        skyUniforms[ 'mieDirectionalG' ].value = 0.8;

        const parameters = {
            elevation: 2,
            azimuth: 180
        };

        /* 太阳 */
        const pmremGenerator = new THREE.PMREMGenerator( renderer );
        function updateSun() {
            const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
            const theta = THREE.MathUtils.degToRad( parameters.azimuth );
            sun.setFromSphericalCoords( 1, phi, theta );
            sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
            (water.material as any).uniforms[ 'sunDirection' ].value.copy( sun ).normalize();
            scene.environment = pmremGenerator.fromScene( sky as any ).texture;
        }
        updateSun();

        const geometry = new THREE.BoxGeometry(30, 30, 30); /* 创建立方体 */
        const material = new THREE.MeshStandardMaterial({roughness: 0}); /* roughness-材质的粗糙程度，0-表示平滑的镜面反射 */
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const controls = new OrbitControls( camera, renderer.domElement );
        controls.maxPolarAngle = Math.PI * 0.495; /* 垂直旋转角度的上下，范围0-Math.PI */
        controls.target.set( 0, 10, 0 );
        controls.minDistance = 40.0;
        controls.maxDistance = 200.0;
        controls.update();

        /* GUI */
        // const gui = new GUI();

        // const folderSky = gui.addFolder( 'Sky' );
        // folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
        // folderSky.add( parameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );
        // folderSky.open();
        // const waterUniforms = (water.material as any).uniforms;
        // const folderWater = gui.addFolder( 'Water' );
        // folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
        // folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
        // folderWater.open();

        animate();

        window.addEventListener( 'resize', onWindowResize );

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize( window.innerWidth, window.innerHeight );
        }

        function animate() {
            requestAnimationFrame( animate );
            render();
        }

        function render() {
            const time = performance.now() * 0.001;
            mesh.position.y = Math.sin( time ) * 20 + 5;
            mesh.rotation.x = time * 0.5;
            mesh.rotation.z = time * 0.51;

            (water.material as any).uniforms[ 'time' ].value += 1.0 / 60.0;
            renderer.render( scene, camera );
        }
    }

    return (
        <canvas id="three"></canvas>
    )
}