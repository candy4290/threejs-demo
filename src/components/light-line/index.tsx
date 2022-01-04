import { useEffect } from "react"
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
/**
 * 发光的线
 *
 * @export
 * @return {*} 
 */
export default function LightLine() {
    useEffect(() => {
        init();
    }, []);
    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        const scene = new THREE.Scene(); /* 场景 */
        // scene.background = new THREE.Color('0x000000');
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000); /* 相机 */
        camera.position.set(50,50,50)
        const renderer = new THREE.WebGLRenderer({canvas}); /* 渲染器 */
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        /* 添加灯光效果 */
        // const directionalLight = new THREE.DirectionalLight( '#fff' )
        // directionalLight.position.set( 30, 30, 30 ).normalize()
        // scene.add( directionalLight )
        // const ambientLight = new THREE.AmbientLight('#fff',0.3) // obj 唯一 id
        // scene.add(ambientLight)

        const axesHelper = new THREE.AxesHelper(50); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        scene.add(axesHelper);

        // const grid = new THREE.GridHelper(10, 10);
        // scene.add(grid);

         //管道线：
         const list =  [
            [-20,15,-10],
            [10,15,-9],
            [10,15,20],
            [40,15,40]
        ]
        //获取线 geo
        const getLineGeo = list =>{
            const l: THREE.Vector3[] = []
            for(let i =0;i<list.length;i++){
                l.push( new THREE.Vector3(list[i][0],list[i][1],list[i][2]));
            }
            const curve = new THREE.CatmullRomCurve3(l) //曲线路径
            const points = curve.getPoints(50) //曲线分五十段，也就是取 51个点

            const geometry = new THREE.BufferGeometry()//创建一个几何 存储这些定点
            geometry['vertices'] = [];
            for(let i =0;i < points.length;i++){
                geometry['vertices'].push( new THREE.Vector3(points[i].x,points[i].y,points[i].z))
            }

            return {
                curve,
                geometry,
                points
            }
        }

        const res  =  getLineGeo(list)

        //管道体
        const tubeGeometry = new THREE.TubeGeometry(res.curve, 1000, 0.1, 30)
        const texture = new THREE.TextureLoader().load("/red_line.png")
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; //每个都重复
        texture.repeat.set(1, 1);
        const tubeMesh = new THREE.Mesh(tubeGeometry , new THREE.MeshBasicMaterial({map:texture, side:THREE.BackSide,transparent:true}))
        texture.needsUpdate = true
        scene.add(tubeMesh)

        function initControls() {
            const  controls = new OrbitControls(camera, renderer.domElement);
            // 如果使用animate方法时，将此函数删除
            //controls.addEventListener( 'change', render );
            // 使动画循环使用时阻尼或自转 意思是否有惯性
            controls.enableDamping = true;
            //动态阻尼系数 就是鼠标拖拽旋转灵敏度
            //controls.dampingFactor = 0.25;
            //是否可以缩放
            controls.enableZoom = true;
            //是否自动旋转
            //controls.autoRotate = true;
            controls.autoRotateSpeed = 0.3;
            //设置相机距离原点的最远距离
            controls.minDistance = 1;
            //设置相机距离原点的最远距离
            controls.maxDistance = 200;
            //是否开启右键拖拽
            controls.enablePan = true
            return controls
        }
        const  controls = initControls()
        
        function animate() {
            controls.update();
            requestAnimationFrame(animate)
            renderer.render(scene,camera)
            texture.offset.x -= 0.01
        }
        animate()

    }
    return (
        <canvas id="three"></canvas>
    )
}