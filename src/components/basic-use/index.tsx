// import { useEffect } from "react"
// import * as THREE from "three";
import './index.less';

export default function BasicUse() {
//     useEffect(() => {
//         // drawLine();
//         createText();
//     }, []);

//     /* 创建线条 */
//     function drawLine() {
//         const canvas = document.querySelector('#three') as HTMLCanvasElement;

//         const renderer = new THREE.WebGLRenderer({canvas}); /* 创建渲染器 */
//         renderer.setSize(window.innerWidth, window.innerHeight)

//         const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 500); /* 透视相机 */
//         camera.position.set(0,0,100);
//         // camera.lookAt(0,0,0);

//         const scene = new THREE.Scene(); /* 创建场景 */

//         const material = new THREE.LineBasicMaterial({color: 0x0000ff}); /* 材质 */

//         const points: THREE.Vector3[] | THREE.Vector2[] = [];
//         points.push(new THREE.Vector3(-10, 0, 0));
//         points.push(new THREE.Vector3(0, 10, 0));
//         points.push(new THREE.Vector3(10, 0, 0));

//         const geometry = new THREE.BufferGeometry().setFromPoints(points); /* 带有一些顶点的集合体 */

//         const line = new THREE.Line(geometry, material); /* 画线 */

//         scene.add(line);
//         renderer.render(scene, camera);
//     }

//     /* 创建文本 */
//     function createText() {
//         THREE.Cache.enabled = true;
//         let camera: THREE.PerspectiveCamera, cameraTarget: number | THREE.Vector3, scene: THREE.Scene & THREE.Object3D, renderer: THREE.WebGLRenderer;
//         let group: THREE.Object3D, textMesh1: THREE.Object3D, textMesh2: THREE.Object3D, textGeo, materials: THREE.MeshPhongMaterial[];
//         let text = "three.js",
//             bevelEnabled = true,
//             font: THREE.Font | undefined = undefined,
//             fontName = "optimer", // helvetiker, optimer, gentilis, droid sans, droid serif
//             fontWeight = "bold"; // normal bold
//         const height = 20,
//               size = 70,
//               hover = 30,
//               curveSegments = 4,
//               bevelThickness = 2,
//               bevelSize = 1.5;
//         const fontMap = {
//             "helvetiker": 0,
//             "optimer": 1,
//             "gentilis": 2,
//             "droid/droid_sans": 3,
//             "droid/droid_serif": 4
//         };
//         const weightMap = {
//             "regular": 0,
//             "bold": 1
//         };
//         const reverseFontMap = [];
//         const reverseWeightMap = [];
//         for ( const i in fontMap ) reverseFontMap[ fontMap[i] ] = i; /* for in 会遍历出继承来的属性 */
//         for ( const i in weightMap ) reverseWeightMap[ weightMap[ i ] ] = i;
//         let targetRotation = 0;

//         const canvas = document.querySelector('#three') as HTMLCanvasElement;

//         /* 相机 */
//         camera = new THREE.PerspectiveCamera(30, window.innerWidth/window.innerHeight, 1, 1500);
//         camera.position.set(0, 400, 700);

//         cameraTarget = new THREE.Vector3();

//         /* 场景 */
//         scene = new THREE.Scene();
//         scene.background = new THREE.Color(0x000000);
//         scene.fog = new THREE.Fog(0x000000, 250, 1400);
        
//         /* 光线 */
//         // const dirLight = new THREE.DirectionalLight(0xffffff, 0.125); /* 平行光 0x表示16进制 */
//         // dirLight.position.set(0,0,1).normalize();
//         // scene.add(dirLight);

//         const pointLight = new THREE.PointLight(0xffffff, 1.5); /* 点光源 */
//         pointLight.position.set(0,100,90);
//         pointLight.color.setHSL( Math.random(), 1, 0.5 );
//         scene.add(pointLight);

//         /* 材质 */
//         materials = [
//             new THREE.MeshPhongMaterial({color: 0xffffff}), /* 具有镜面高光的光泽表面的材质。flatShading定义材质是否使用平面着色进行渲染 */
//             new THREE.MeshPhongMaterial({color: 0xffffff}), 
//         ];

//         group = new THREE.Group();
//         group.position.y = 100;
//         scene.add(group);

//         /* 加载字体 */
//         const loader = new THREE.FontLoader(); /* 使用json格式来加载字体的一个类 */
//         loader.load('/fonts/' + fontName + '_' + fontWeight + '.typeface.json', response => {
//             font = response;
//             /* 刷新文本 */
//             if (font) {
//                 refreshText();
//             }
//         });

//         const plane = new THREE.Mesh(
//             new THREE.PlaneGeometry(10000, 10000),
//             new THREE.MeshBasicMaterial({color: 0xffffff, opacity: .5, transparent: true})
//         );
//         plane.position.y = 100;
//         plane.position.x = - Math.PI / 2;
//         scene.add(plane);

//         /* 渲染器 */
//         renderer = new THREE.WebGLRenderer({canvas, antialias: true});
//         renderer.setPixelRatio(window.devicePixelRatio);
//         renderer.setSize(window.innerWidth, window.innerHeight);

//         function cT() {
//             if (!font) {
//                 return;
//             }
//             textGeo = new THREE.TextGeometry(text, {
//                 font, /* 字体实例 */
//                 size, /* 字体大小，默认100 */
//                 height, /* 挤出文本的厚度 */
//                 curveSegments, /* （表示文本的）曲线上点的数量，默认为12 */
//                 bevelThickness, /* 文本斜角的深度，默认20  */
//                 bevelSize, /* 斜角与原始文本轮廓之间的延伸距离。默认值为8。 */
//                 bevelEnabled /* 是否开启斜角 */
//             });
//             textGeo.computeBoundingBox(); /* 外边界矩形 */
//             if (textGeo.boundingBox) {
//                 const centerOffset = - 0.5 * ( textGeo.boundingBox?.max.x - textGeo.boundingBox.min.x );
//                 textMesh1 = new THREE.Mesh( textGeo, materials ); /* 物体 */

// 				textMesh1.position.x = centerOffset;
// 				textMesh1.position.y = hover;
// 				// textMesh1.position.z = 0;

// 				// textMesh1.rotation.x = 0;
// 				// textMesh1.rotation.y = Math.PI * 2;
// 				group.add( textMesh1 );
//             }
//         }

//         function refreshText() {
//             group.remove( textMesh1 );
//             if ( ! text ) return;
//             cT();
//         }

//         animate();

//         function animate() {
//             requestAnimationFrame( animate );
//             render();
//         }

//         function render() {
//             group.rotation.y += ( targetRotation - group.rotation.y ) * 0.05;
//             camera.lookAt( cameraTarget );
//             renderer.clear();
//             renderer.render( scene, camera );
//         }

//     }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}