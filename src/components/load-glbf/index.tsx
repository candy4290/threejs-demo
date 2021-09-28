import { useEffect } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from 'three';

export default function LoadGlbf() {

  useEffect(() => {
    loadModel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadModel() {
    const loader = new GLTFLoader();
    const scene = new THREE.Scene(); /* 创建场景 */
    scene.background = new THREE.Color('#eee')
    const canvas = document.querySelector('#three') as HTMLCanvasElement;
    const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 10000 ); /* 创建相机 */
    camera.position.x = 600; /* 默认情况下，当我们调用scene.add() 时，我们添加的东西将被添加到坐标(0,0,0) 中。这将导致相机和立方体在彼此内部。为了避免这种情况，我们只需将相机移出一点。 */
    camera.position.y = 0; /* 默认情况下，当我们调用scene.add() 时，我们添加的东西将被添加到坐标(0,0,0) 中。这将导致相机和立方体在彼此内部。为了避免这种情况，我们只需将相机移出一点。 */
    camera.position.z = 600; /* 默认情况下，当我们调用scene.add() 时，我们添加的东西将被添加到坐标(0,0,0) 中。这将导致相机和立方体在彼此内部。为了避免这种情况，我们只需将相机移出一点。 */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); /* 创建渲染器 */
    const controls = new OrbitControls(camera, renderer.domElement); /* 相机控件 */
    controls.enableDamping = true;

    function animate() {
      controls.update()
      renderer.render(scene, camera)
      requestAnimationFrame(animate)

      //添加下面代码
      if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement
        camera.aspect = canvas.clientWidth / canvas.clientHeight
        camera.updateProjectionMatrix()
      }
    }
    animate()
    loader.setPath('/glbs/the_lighthouse/');
    
    loader.load( 'scene.gltf', function ( gltf ) {
      const modal = gltf.scene;
      scene.add( modal );
    }, undefined, function ( error ) {
    
      console.error( error );
    
    } );
  }

  function resizeRendererToDisplaySize(renderer: any) {
    const canvas = renderer.domElement
    var width = window.innerWidth
    var height = window.innerHeight
    var canvasPixelWidth = canvas.width / window.devicePixelRatio
    var canvasPixelHeight = canvas.height / window.devicePixelRatio

    const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height
    if (needResize) {
      renderer.setSize(width, height, false)
    }
    return needResize
  }


  return (
    <canvas id="three"></canvas>
  );
}