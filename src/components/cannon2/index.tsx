import { useEffect } from "react"
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as CANNON from 'cannon-es';

let scene: THREE.Scene;
let camera: THREE.Camera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let clock = new THREE.Clock();

let world: CANNON.World;
let ground: THREE.Mesh;
let bodyGround: CANNON.Body;
let boxes: any[] = []; /* boxMeshes的刚体数据 */
let boxMeshes: any[] =[];
let ballMeshes: any[] =[];
let balls: any[] =[]; /* ballMeshes的刚体数据 */
let color = new THREE.Color();

/**
 * 点对点约束
 *
 * @export
 * @return {*} 
 */
export default function Cannon2() {
    useEffect(() => {
        init();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
        camera.position.x = 40;
        camera.position.y = 52;
        camera.position.z = 78;
        scene.add( camera );

        scene.add(new THREE.AxesHelper(40)); 

        scene.add(new THREE.AmbientLight(0x888888));

        const light = new THREE.DirectionalLight(0xbbbbbb, 1);
        light.position.set(0, 50, 50);

        let texture = new THREE.TextureLoader().load('/textures/brick_diffuse.jpg');
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.copy(new THREE.Vector2(40, 40));

        let groundGeom = new THREE.BoxBufferGeometry(100, 0.2, 100);
        let groundMate = new THREE.MeshPhongMaterial({color: 0xdddddd, map: texture})
        ground = new THREE.Mesh(groundGeom, groundMate);
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        scene.add(ground);

        renderer = new THREE.WebGLRenderer({antialias: true, canvas});
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.shadowMap.enabled = true;
        renderer.setClearColor(0xbfd1e5);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 10, 0);
        camera.lookAt(0,10,0);

        initCannon();
        render();
    }

    function initCannon() {
        world = new CANNON.World();
        world.gravity.set(0,-9.8,0);
        world.broadphase = new CANNON.NaiveBroadphase(); /* NaiveBroadphase是默认的碰撞检测方式，该碰撞检测速度比较高 */
        bodyGround = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(0,-0.1,0),
            shape: new CANNON.Box(new CANNON.Vec3(50, 0.1, 50)),
            material: new CANNON.Material({friction: 0.05, restitution: 0})
        });
        ground.userData = bodyGround;
        world.addBody(bodyGround);

        let N = 20, space = 0.1, mass = 0, width = 10, hHeight = 1, last;
        let halfVec = new CANNON.Vec3(width, hHeight, 0.2);//刚体的长宽高的halfSize向量
        let boxShape = new CANNON.Box(halfVec);//定义一个长方体数据
        let boxGeometry = new THREE.BoxBufferGeometry(halfVec.x * 2, halfVec.y * 2, halfVec.z * 2);//定义一个长方几何体
        let boxMaterial = new THREE.MeshLambertMaterial( { color: 0xffaa00 } );//定义几何体材质

        for(let i=0; i<N; i++) {//遍历N次，从上到下创建长方体网格和刚体，位置逐渐变低，质量逐渐变小。
            let boxBody = new CANNON.Body({mass: mass, material: new CANNON.Material({friction: 0.05, restitution: 0})});//创建刚体，第一个刚体的质量设置成0（即为不动的刚体），定义材质，并设置摩擦系数和弹性系数
            boxBody.addShape(boxShape);//为刚体添加形状
            let boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);//创建three世界的网格
            boxBody.position.set(0, (N - i + 5) * (hHeight * 2 + space * 2), 0);//这里设置刚体的位置，是由上倒下的顺序
            boxBody.linearDamping = 0.01;//设置线性阻尼
            boxBody.angularDamping = 0.01;//设置旋转阻尼
            world.addBody(boxBody);//将刚体添加到物理世界中
            scene.add(boxMesh);//将网格添加到three场景中
            boxes.push(boxBody);//将刚体添加到数组中
            boxMesh.userData = boxBody;
            boxMeshes.push(boxMesh);//将网格添加到数组中，这两步可以在更新物理世界中找到他们的对应关系，也可以添加到Mesh的userData属性中去，具体可以参见上一篇文章
            if(i === 0) { //当i=0时，也就是第一个刚体，在刚体创建完毕后，我们将mass变量设置成1
                mass = 1;
            } else {//从第二个刚体往后都会创建两个点对点的约束，点对点约束我们下面讲
                const ptp1 = new CANNON.PointToPointConstraint(boxBody, new CANNON.Vec3(-width, hHeight + space, 0), last, new CANNON.Vec3(-width, -hHeight - space, 0), (N - i) / 4);
                const ptp2 = new CANNON.PointToPointConstraint(boxBody, new CANNON.Vec3(width, hHeight + space, 0), last, new CANNON.Vec3(width, -hHeight - space, 0), (N - i) / 4);
                world.addConstraint(ptp1);//将约束添加到物理世界
                world.addConstraint(ptp2);//将约束添加到物理世界
            }
            last = boxBody;//这里将本次创建的刚体赋值给last变量，一遍下一个循环使用
        }

        document.addEventListener('click', event => { //点击鼠标
            event.preventDefault();//阻止默认事件
            let x = (event.clientX / window.innerWidth) * 2 - 1;//将鼠标点击的x值转换成[-1, 1]
            let y = - (event.clientY / window.innerHeight) * 2 + 1;//将鼠标点击的y值转换成[-1, 1]
            let p = new THREE.Vector3(x, y, -1).unproject(camera);//通过unproject方法，使用所传入的摄像机来反投影（projects）该向量，得到鼠标对应三维空间点
            let v = p.sub(camera.position).normalize();//用鼠标对应的三维空间点减去相机的位置向量，然后归一化得到小球的射出方向的单位向量
            createSphere(v, camera.position);//把需要的两个向量传入创建小球的方法中
        })
    }
    function createSphere(v, c) {
            //创建小球的方法和上一篇很相似，我就不赘述了
        const speed = 50;
        var geometry = new THREE.SphereBufferGeometry(1.5, 32, 16);
        let sphere = new THREE.Mesh( geometry, createRandomMaterial());
        sphere.position.copy(c);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        scene.add( sphere );
        ballMeshes.push(sphere);
    
        let sphereBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(c.x, c.y, c.z),
            shape: new CANNON.Sphere(1.5),
            material: new CANNON.Material({friction: 0.1, restitution: 0})
        });
        sphereBody.collisionResponse = true;
        sphereBody.velocity.set(v.x * speed, v.y * speed, v.z * speed);//这里要注意velocity属性可以刚体带有初速度
        world.addBody(sphereBody);
        balls.push(sphereBody);
        sphere.userData = sphereBody;
    
        setTimeout(() => {
            scene.remove(sphere);
            sphere.material.dispose();
            sphere.geometry.dispose();
            world.removeBody(sphereBody);
            balls.shift();
            ballMeshes.shift();
        }, 60000)
    }
    function createRandomMaterial() {
        color.setHSL(Math.random(), 1.0, 0.5);
        return new THREE.MeshPhongMaterial({color: color});
    }

    function render() {
        requestAnimationFrame(render);
        world.step(clock.getDelta()); //第一个参数是以固定步长更新物理世界参数（详情请看api）
        // scene.children.forEach((d: any) => {//遍历场景中的子对象，如果对象的isMesh属性为true，我们就将更新改对象的position和quaternion属性（他们对应的刚体数据存在对应的userData中）。
        //     if(d.isMesh === true) {
        //         d.position.copy(d.userData.position);
        //         d.quaternion.copy(d.userData.quaternion); /* 对象局部旋转的四元数-欧拉角 */
        //     }
        // })
        ballMeshes.forEach((item, idx) => {
            item.position.copy(balls[idx].position);
            item.quaternion.copy(balls[idx].quaternion);
        })
        boxMeshes.forEach((item, idx) => {
            item.position.copy(boxes[idx].position);
            item.quaternion.copy(boxes[idx].quaternion);
        })
        controls.update();
        renderer.render(scene, camera);
    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}