import axios from 'axios';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * 绘制路径
 *
 * @export
 */
export function drawLine() {
    return axios.get('/roads/router.json').then(rsp => {
        return new THREE.CatmullRomCurve3([ /* 平滑三维曲线 */
            ...rsp.data.map(item => new THREE.Vector3(item.x, item.y, item.z))
            // ...lines[index].map(item => new THREE.Vector3(item[0], 0, item[1]))
        ], false/*是否闭合*/,
            'catmullrom', 0
        );
    })
}

export function selfDrawLine(points: THREE.Vector3[]) {
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0)
}

/* 加载兰博基尼 */
// TODO：找轮子
export function createLbjn(scene: THREE.Scene) {
    const loader = new GLTFLoader();
    loader.load('/glbs/兰博基尼/scene.gltf', (gltf) => {
        gltf.scene.position.y = 1.2;
        scene.add(gltf.scene)
    })
}

/* 加载大客车 */
export function createDKC(scene: THREE.Scene) {
    const loader = new GLTFLoader();
    loader.load('/glbs/大客车/scene.gltf', (gltf) => {
        const temp = gltf.scene;
        temp.position.y = 0.2;
        temp.scale.set(0.01,0.01,0.01);
        temp.position.set(393.45462174007855,
            0.8207065951805141,
            -41.40129219574282)
        scene.add(gltf.scene)
    })
}

export function createCarsBindTrace(scene: THREE.Scene, carList: any[], testCarModels: any[]) {
    const colors = ['blue', 'green', 'red', 'black', 'yellow', 'white', 'pink']
    axios.get('/roads/routes.json', {}).then(rsp => {
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: '#00CCFF', metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05
        });
        const detailsMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, metalness: 1.0, roughness: 0.5
        });
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, metalness: 0, roughness: 0.1, opacity: 0.8, transparent: true
        });
        
        // Car
        const shadow = new THREE.TextureLoader().load('/glbs/ferrari_ao.png');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/js/libs/draco/gltf/');
        
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        loader.load('/glbs/ferrari.glb', (gltf) => {
            const carModel: any = gltf.scene.children[0];
            carModel.traverse((object: any) => {
                if (object.isMesh) {
                    // object.userData = {
                    //     'hasOutlinePass': true,
                    // }
                    object.castShadow = true; /* 物体开启“引起阴影” */
                    object.receiveShadow = true; /* 物体开启“接收阴影” */
                };
            });
            carModel.getObjectByName('body').material = bodyMaterial;
            carModel.getObjectByName('rim_fl').material = detailsMaterial;
            carModel.getObjectByName('rim_fr').material = detailsMaterial;
            carModel.getObjectByName('rim_rr').material = detailsMaterial;
            carModel.getObjectByName('rim_rl').material = detailsMaterial;
            carModel.getObjectByName('trim').material = detailsMaterial;
            carModel.getObjectByName('glass').material = glassMaterial;
        
            // shadow
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
                new THREE.MeshBasicMaterial({
                    map: shadow, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true
                })
            );
            mesh.rotation.x = - Math.PI / 2;
            mesh.renderOrder = 2;
            const testCarModel = carModel.clone();
            testCarModel.progress = 0;
            testCarModel.wheels = [];
            testCarModel.wheels.push(
                testCarModel.getObjectByName('wheel_fl'),
                testCarModel.getObjectByName('wheel_fr'),
                testCarModel.getObjectByName('wheel_rl'),
                testCarModel.getObjectByName('wheel_rr')
            );
            testCarModel.position.set(null)
            testCarModels.push(testCarModel)
            scene.add(testCarModel);
            // light.target = carModel; /* 平行光现在就可以追踪到目标对像了 */

            rsp.data.routes.forEach((item, index) => {
                const temp = carModel.clone();
                temp.getObjectByName('body').material = new THREE.MeshPhysicalMaterial({
                    color: colors[index] || Math.random()*0xffffff, metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05
                });
                temp.color = colors[index];
                temp.trace = item.points;
                temp.progress = 0;
                temp.wheels = [];
                temp.wheels.push(
                    temp.getObjectByName('wheel_fl'),
                    temp.getObjectByName('wheel_fr'),
                    temp.getObjectByName('wheel_rl'),
                    temp.getObjectByName('wheel_rr')
                );
                temp.catmullRomCurve3 = selfDrawLine(item.points.map(i => new THREE.Vector3(i.x, i.y, i.z)));
                temp.catmullRomCurve3Length = temp.catmullRomCurve3.getLength();
                carList.push(temp)
                scene.add(temp);
            });
        });
    })    
}