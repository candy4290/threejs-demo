import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
export default function TextShapes() {
    const modelRef = useRef<{
        camera: THREE.PerspectiveCamera,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer
    }>({} as any);
    let { camera, scene, renderer } = modelRef.current;

    useEffect(() => {
        init();
        animate();
        return () => {
            window.removeEventListener('resize', onWindowResize);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(0, -400, 600);

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        const axesHelper = new THREE.AxesHelper(1000); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        scene.add(axesHelper);

        const loader = new THREE.FontLoader();
        loader.load('/fonts/helvetiker_regular.typeface.json', font => {
            const color = 0x006699;
            const matDark = new THREE.LineBasicMaterial({ /* 绘制线框样式几何体的材质 */
                color,
                side: THREE.DoubleSide
            });
            const matLite = new THREE.MeshBasicMaterial({ /* 此材质不受光照影响 */
                color,
                transparent: true,
                opacity: .4,
                side: THREE.DoubleSide
            });

            const msg = 'Thress.js\nSimple text.';
            const shapes = font.generateShapes(msg, 100);
            const geometry = new THREE.ShapeGeometry(shapes); /* 从一个或多个路径形状中创建一个单面多边形几何体 */
            geometry.computeBoundingBox(); /* 计算当前几何体的边界矩形 */
            if (geometry.boundingBox) {
                const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
                geometry.translate(xMid, 0, 0);

                const text = new THREE.Mesh(geometry, matLite);
                text.position.z = - 150;
                scene.add(text);

                const holeShapes: any[] = [];
                for (let i = 0; i < shapes.length; i++) {
                    const shape = shapes[i];
                    if (shape.holes && shape.holes.length > 0) {
                        for (let j = 0; j < shape.holes.length; j++) {
                            const hole = shape.holes[j];
                            holeShapes.push(hole);
                        }
                    }
                }
                shapes.push.apply(shapes, holeShapes);

                const lineText = new THREE.Object3D();
                for (let i = 0; i < shapes.length; i++) {
                    const shape = shapes[i];
                    const points = shape.getPoints();
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    geometry.translate(xMid, 0, 0);
                    const lineMesh = new THREE.Line(geometry, matDark);
                    lineText.add(lineMesh);
                }
                scene.add(lineText);
            }
        });

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.update();

        window.addEventListener('resize', onWindowResize);

    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}