import { useEffect } from "react"
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function MaterialsEnvmaps() {
    useEffect(() => {
        create();
    }, []);

    function create() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 100000 );
        camera.position.set( 0, 0, 1000 );

        // SCENE
        const scene = new THREE.Scene();

        // Lights
        const ambient = new THREE.AmbientLight( 0xffffff );
        scene.add( ambient );

        // Textures
        const loader = new THREE.CubeTextureLoader(); /* 全景贴图 */
        loader.setPath( '/textures/cube/Bridge2/' );

        /* px-左 nx-右 py-顶 ny-底 pz-后 nz-前 */
        const textureCube = loader.load( [ 'posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg' ] );
        textureCube.encoding = THREE.sRGBEncoding;

        const textureLoader = new THREE.TextureLoader();

        const textureEquirec = textureLoader.load( '/textures/2294472375_24a3b8ef46_o.jpg' );
        textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
        textureEquirec.encoding = THREE.sRGBEncoding;

        scene.background = textureCube;
        // scene.background = textureEquirec;

        const geometry = new THREE.IcosahedronGeometry( 400, 150 ); /* 二十面体 */
        const sphereMaterial = new THREE.MeshLambertMaterial( { envMap: textureCube } ); /* 创建材质 */
        const sphereMesh = new THREE.Mesh( geometry, sphereMaterial );
        scene.add( sphereMesh );

        const renderer = new THREE.WebGLRenderer({canvas});
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.outputEncoding = THREE.sRGBEncoding;

        const controls = new OrbitControls( camera, renderer.domElement );
        controls.target.set(0, 0.5, 0);
        controls.update(); /* must be called after any manual changes to the camera's transform */
        controls.enablePan = false; /* 禁止右键拖拽 */
        controls.enableDamping = true; /* 阻尼效果 */
        controls.minDistance = 500;
        controls.maxDistance = 2500;
        animate();

        function animate() {
            controls.update();
            requestAnimationFrame(animate);
            render();
        }

        function render() {
            camera.lookAt( scene.position );
            renderer.render( scene, camera );
        }
    }

    return (
        <canvas id="three"></canvas>
    )
}