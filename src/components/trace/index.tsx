import { useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * 运动轨迹
 *
 * @export
 * @return {*} 
 */
export default function Trace() {

    useEffect(() => {
        init();
    }, [])

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        /**
     * 创建场景对象
     */
        const scene = new THREE.Scene();
        /**
         * 创建一个设置重复纹理的管道
         */
        const curve = new THREE.CatmullRomCurve3([ /* 平滑三维曲线 */
            new THREE.Vector3(-80, -40, 0),
            new THREE.Vector3(-70, 40, 0),
            new THREE.Vector3(70, 40, 0),
            new THREE.Vector3(80, -40, 0)
        ], false/*是否闭合*/);
        const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.6, 50, false); /* 管道缓冲几何体 100-分段数 0.6-管道半径 50-管道横截面的分段数目 */
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('run.jpg');
        // 设置阵列模式为 RepeatWrapping
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // 设置x方向的偏移(沿着管道路径方向)，y方向默认1
        //等价texture.repeat= new THREE.Vector2(20,1)
        texture.repeat.x = 20;
        const tubeMaterial = new THREE.MeshPhongMaterial({ /* 具有镜面高光的光泽表面的材质 */
            map: texture,
            transparent: true,
        });
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        scene.add(tube)
        /**
         * 创建一个半透明管道
         */
        const tubeGeometry2 = new THREE.TubeGeometry(curve, 100, 2, 50, false);
        const tubeMaterial2 = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.3,
        });
        const tube2 = new THREE.Mesh(tubeGeometry2, tubeMaterial2);
        scene.add(tube2)

        scene.add(new THREE.AxesHelper(300))



        //小人box
        //geometryP = new THREE.CircleGeometry( 5, 32 );               
        const geometryP = new THREE.SphereGeometry(5, 16, 16); /* 球缓冲几何体 */
        // console.log('geometryP', geometryP);
        const materialP = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        const circleP = new THREE.Mesh(geometryP, materialP);
        scene.add(circleP);
        geometryP.rotateY(Math.PI / 2);

        circleP.position.set(-80, -40, 0);
        // console.log(circleP);




        /**
         * 光源设置
         */
        //点光源
        const point = new THREE.PointLight(0xffffff);
        point.position.set(400, 200, 300); //点光源位置
        scene.add(point); //点光源添加到场景中
        //环境光
        const ambient = new THREE.AmbientLight(0x888888);
        scene.add(ambient);
        /**
         * 相机设置
         */
        const width = window.innerWidth; //窗口宽度
        const height = window.innerHeight; //窗口高度
        const k = width / height; //窗口宽高比
        const s = 100; //三维场景缩放系数
        //创建相机对象
        const camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
        camera.position.set(200, 300, 200); //设置相机位置
        camera.lookAt(scene.position); //设置相机方向(指向的场景对象)
        /**
         * 创建渲染器对象
         */
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas
        });
        renderer.setSize(width, height);
        // renderer.setClearColor(0xb9d3ff,1);//设置背景颜色



        let progress = 0;

        // 渲染函数
        function render() {
            renderer.render(scene, camera); //执行渲染操作
            requestAnimationFrame(render);
            // 使用加减法可以设置不同的运动方向
            // 设置纹理偏移
            texture.offset.x -= 0.06

            if (progress > 1.0) {
                return;    //停留在管道末端,否则会一直跑到起点 循环再跑
            }
            progress += 0.0009;
            // console.log(progress);
            if (curve) {
                let point = curve.getPoint(progress);
                if (point && point.x) {
                    circleP.position.set(point.x, point.y, point.z);
                }
            }

        }
        render();
        const controls = new OrbitControls(camera, renderer.domElement); //创建控件对象
    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}