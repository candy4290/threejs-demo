import axios from 'axios';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import NProgress from 'nprogress';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';
import TWEEN from '@tweenjs/tween.js'

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
        temp.scale.set(0.01, 0.01, 0.01);
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
            const t = {
                routes: [

                ]
            }
            rsp.data.routes.forEach((item, index) => {
                const temp = carModel.clone();
                if (index === 0) {
                    temp.add()
                }
                temp.getObjectByName('body').material = new THREE.MeshPhysicalMaterial({
                    color: colors[index] || Math.random() * 0xffffff, metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05
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
                temp.speed = (Math.floor(Math.random() * 60) + 60);
                temp.catmullRomCurve3 = selfDrawLine(item.points.map(i => new THREE.Vector3(i.x, i.y, i.z)));
                temp.catmullRomCurve3Length = temp.catmullRomCurve3.getLength();
                // const tt = getTotalRoutes(temp.catmullRomCurve3, scene);
                // (t.routes as any).push({
                //     name: 'xxx',
                //     points: tt
                // })
                carList.push(temp)
                scene.add(temp);
            });
            console.log(t);
        });
    })
}

function getTotalRoutes(catmullRomCurve3: THREE.CatmullRomCurve3, scene: THREE.Scene) {
    let progress = 0.001;
    const result: any = [];
    while (progress <= 1) {
        const point = catmullRomCurve3.getPointAt(progress)
        progress+=0.001;
        const ray = new THREE.Raycaster(new THREE.Vector3(point.x, point.y + 2, point.z), new THREE.Vector3(0,-1,0)); 
        const tt = ray.intersectObjects(scene.children);
        if (tt.length > 0) {
            const a = tt[0].point;
            result.push({x: a.x, y: a.y, z: a.z});
        }
    }
    return result;
    // console.log(result);
}

export function loadRoad(scene: THREE.Scene) {
    const loader = new GLTFLoader();
    let minx = 0;
    let miny = 0;
    let minz = 0;
    let maxx = 0;
    let maxy = 0;
    let maxz = 0;
    loader.load('/glbs/与道路接轨的桥/scene.gltf', (gltf) => {
        // const temp = gltf.scene.children[0].children[0].children[0].children[0].children[0].children[4];
        const temp = gltf.scene.children[0];
        // console.log(temp);
        // 4-黄线 5-桥 6-平地路网
        // const t = temp.getObjectByName('B_Col_DYel') as THREE.Mesh;
        // console.log(t.geometry.attributes.position.array)
        temp.traverse((object: any) => {
            if (object.isMesh) {
                object.geometry.computeBoundingBox();
                const t = object.geometry.boundingBox;
                if (t.min.x < minx) {
                    minx = t.min.x
                }
                if (t.min.y < miny) {
                    miny = t.min.y
                }
                if (t.min.z < minz) {
                    minz = t.min.z
                }
                if (t.max.x > maxx) {
                    maxx = t.max.x
                }
                if (t.max.y > maxy) {
                    maxy = t.max.y
                }
                if (t.max.z > maxz) {
                    maxz = t.max.z
                }
                object.castShadow = true; /* 物体开启“引起阴影” */
                object.receiveShadow = true; /* 物体开启“接收阴影” */
            };
        });
        temp.position.y = -5.6;
        console.log({ minx, miny, minz }, { maxx, maxy, maxz }, { x: maxx - minx, y: maxy - miny, z: maxz - minz })
        scene.add(temp);

        // drawLine().then(rsp => {catmullRomCurve3 = rsp;catmullRomCurve3Length = catmullRomCurve3.getLength()});
    }, e => {
        if (e.lengthComputable) {
            const percent = e.loaded / e.total;
            NProgress.set(percent);
        }
    });
}

/**
 * 利用Tweenjs实现flyto效果
 *
 * @export
 * @param {MapControls} controls
 * @param {*} option
 * @param {THREE.PerspectiveCamera} camera
 * @return {*} 
 */
export function flyTo2(controls: MapControls, option: any, camera: THREE.PerspectiveCamera) {
    option.position = option.position || [] //相机新的位置
    option.controls = option.controls || [] //控制器新的中心点位置(围绕词典旋转等)
    option.duration = option.duration || 1000 //飞行时间
    option.easing = option.easing || TWEEN.Easing.Linear.None;
    TWEEN.removeAll();
    const curPosition = camera.position
        , controlsTar = controls.target
        , tween = new TWEEN.Tween({
            x1: curPosition.x, // 相机当前位置x
            y1: curPosition.y, // 相机当前位置y
            z1: curPosition.z, // 相机当前位置z
            x2: controlsTar.x, // 控制当前的中心点x
            y2: controlsTar.y, // 控制当前的中心点y
            z2: controlsTar.z // 控制当前的中心点z
        }).to({
            x1: option.position[0], // 新的相机位置x
            y1: option.position[1], // 新的相机位置y
            z1: option.position[2], // 新的相机位置z
            x2: option.controls[0], // 新的控制中心点位置x
            y2: option.controls[1], // 新的控制中心点位置x
            z2: option.controls[2] // 新的控制中心点位置x
        }, option.duration).easing(TWEEN.Easing.Linear.None) // TWEEN.Easing.Cubic.InOut //匀速
    tween.onUpdate(() => {
        controls.enabled = false
        camera.position.set(tween['_object'].x1, tween['_object'].y1, tween['_object'].z1)
        controls.target.set(tween['_object'].x2, tween['_object'].y2, tween['_object'].z2)
        controls.update()
        if (option.update instanceof Function)
            option.update(tween)
    })
    tween.onStart(() => {
        controls.enabled = false
        if (option.start instanceof Function)
            option.start()
    })
    tween.onComplete(() => {
        controls.enabled = true
        if (option.done instanceof Function)
            option.done()
    })
    tween.onStop(() => option.stop instanceof Function ? option.stop() : '')
    tween.start()
    TWEEN.add(tween)
    return tween
}