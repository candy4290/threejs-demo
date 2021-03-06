import axios from 'axios';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import TWEEN from '@tweenjs/tween.js'
import SnowPng from '../../assets/images/3d/snow.png';

export function forMaterial(materials, callback) {
    if (!callback || !materials) return false;
    if (Array.isArray(materials)) {
        materials.forEach((mat) => {
            callback(mat);
        });
    } else {
        callback(materials);
    }
}

// 获取到包围的线条
export function surroundLineGeometry(object) {
    return new THREE.EdgesGeometry(object.geometry); /* 边缘几何体 */
}

export function createLightLine(list: number[][], scene: THREE.Scene, path = '/red_line.png') {
    //获取线 geo
    const getLineGeo = list => {
        const l: THREE.Vector3[] = []
        for (let i = 0; i < list.length; i++) {
            l.push(new THREE.Vector3(list[i][0], list[i][1], list[i][2]));
        }
        const curve = new THREE.CatmullRomCurve3(l, false/*是否闭合*/,
            'catmullrom', 0) //曲线路径
        const points = curve.getPoints(50) //曲线分五十段，也就是取 51个点

        const geometry = new THREE.BufferGeometry()//创建一个几何 存储这些定点
        geometry['vertices'] = [];
        for (let i = 0; i < points.length; i++) {
            geometry['vertices'].push(new THREE.Vector3(points[i].x, points[i].y, points[i].z))
        }

        return {
            curve,
            geometry,
            points
        }
    }

    const res = getLineGeo(list)

    //管道体
    const tubeGeometry = new THREE.TubeGeometry(res.curve, 1000, 1, 30)
    const texture = new THREE.TextureLoader().load(path)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; //每个都重复
    // texture.repeat.set(6, 1);
    // texture.repeat.x = 50;
    const tubeMesh = new THREE.Mesh(
        tubeGeometry, 
        new THREE.MeshPhongMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        })
        // new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, opacity: 1 })
    );
    texture.needsUpdate = true
    tubeMesh.position.setY(1)
    scene.add(tubeMesh)
    return texture;
}

export function selfDrawLine(points: THREE.Vector3[]) {
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0)
}

export function createCarsBindTrace(scene: THREE.Scene, carList: any[], testCarModels: any[]) {
    const colors = ['blue', 'green', 'red', 'black', 'yellow', 'white', 'pink']
    axios.get('/roads/routes-city.json', {}).then(rsp => {
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
            // carModel.scale.set(4,4,4)

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
        });
    })
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
 export function flyTo2(controls: MapControls, option: any, camera: THREE.PerspectiveCamera, group: TWEEN.Group, delay?: number) {
    group.removeAll();
    option.position = option.position || [] //相机新的位置
    option.controls = option.controls || [] //控制器新的中心点位置(围绕词典旋转等)
    option.duration = option.duration || 1000 //飞行时间
    option.easing = option.easing || TWEEN.Easing.Linear.None;
    const curPosition = camera.position
        , controlsTar = controls.target
        , tween = new TWEEN.Tween({
            x1: curPosition.x, // 相机当前位置x
            y1: curPosition.y, // 相机当前位置y
            z1: curPosition.z, // 相机当前位置z
            x2: controlsTar.x, // 控制当前的中心点x
            y2: controlsTar.y, // 控制当前的中心点y
            z2: controlsTar.z // 控制当前的中心点z
        }, group).to({
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
    delay && tween.delay(delay)
    tween.start()
    return tween
}

/**
 * 利用Tweenjs实现物体平滑移动效果
 *
 * @export
 * @param {*} option
 * @param {THREE.PerspectiveCamera} camera
 * @return {*} 
 */
 export function flyObj(obj: THREE.Object3D, option: any) {
    //  TWEEN.removeAll();
    option.position = option.position || [] //物体新的位置
    option.duration = option.duration || 1000 //飞行时间
    option.easing = option.easing || TWEEN.Easing.Linear.None;
    const curPosition = obj.position
        , tween = new TWEEN.Tween({
            x1: curPosition.x, // 当前位置x
            y1: curPosition.y, // 当前位置y
            z1: curPosition.z, // 当前位置z
        }).to({
            x1: option.position[0], // 新的位置x
            y1: option.position[1], // 新的位置y
            z1: option.position[2], // 新的位置z
        }, option.duration).easing(TWEEN.Easing.Linear.None) // TWEEN.Easing.Cubic.InOut //匀速
    tween.onUpdate(() => {
        obj.position.set(tween['_object'].x1, tween['_object'].y1, tween['_object'].z1)
        if (option.update instanceof Function)
            option.update(tween)
    })
    tween.onStart(() => {
        if (option.start instanceof Function)
            option.start()
    })
    tween.onComplete(() => {
        if (option.done instanceof Function)
            option.done()
    })
    tween.onStop(() => option.stop instanceof Function ? option.stop() : '')
    tween.start()
    // TWEEN.add(tween)
    return tween;
}

/**
 * 利用Tweenjs实现物体在一系列坐标间平滑移动效果
 *
 * @export
 * @param {*} option
 * @param {THREE.PerspectiveCamera} camera
 * @return {*} 
 */
export function flyObjWithPositionList(obj: THREE.Object3D, positions: [number, number, number][], onDown?: Function) {
    let len = positions.length;
    let tween = flyObj(obj, {
        duration: 10000,
        position: positions[0],
    });
    tween.onComplete(() => {
        if (len > 1) {
            flyObjWithPositionList(obj, positions.slice(1), onDown);
        } else {
            onDown && onDown();
        }
    })
}

function updateGeomData(positions: number[], speeds: number[], range: number, isUpdate = false) {
    for (let i = 0; i < 100000; i++) {
        if (isUpdate) {
            positions[i*3+0] = positions[i*3+0] - (speeds[i*3+0]);
            positions[i*3+1] = positions[i*3+1] - (speeds[i*3+1]);
            positions[i*3+2] = positions[i*3+2] - (speeds[i*3+2]);

            // 边界检查
            if (positions[i*3+0] <= -range/2 || positions[i*3+0] >= range/2) positions[i*3+0] = positions[i*3+0] * -1;
            if (positions[i*3+1] <= 18) positions[i*3+1] = range/2 + 18;
            if (positions[i*3+2] <= -range/2 || positions[i*3+2] >= range/2) speeds[i*3+2] = speeds[i*3+2] * -1;
        } else {
            positions[i*3+0] = Math.random() * range - range/2;
            positions[i*3+1] = Math.random() * range/2 + 18;
            positions[i*3+2] = Math.random() * range - range/2;

            speeds[i*3+0] = (Math.random() - 0.5) / 3;
            speeds[i*3+1] = 0.1 + Math.random() / 5;
            speeds[i*3+2] = (Math.random() - 0.5) / 3;
        }
    }
}

/* 添加雪花效果 */
export function addSnow(scene: THREE.Scene, fn) {
    const range = 2000; /* 雪花出现范围 */
    new THREE.TextureLoader().load(SnowPng, texture => {
        const material = new THREE.PointsMaterial({
            size: 2,
            map: texture,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending, // 融合模式
        });
        if (material.map) {
            material.map.repeat = new THREE.Vector2(1,1);
        }
        let positions: any = [];
        let speeds: any = [];
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(20000 * 3), 3));
        geom.setAttribute('speed', new THREE.BufferAttribute(new Float32Array(20000 * 3), 3));
        positions = geom.attributes.position.array;
        speeds = geom.attributes.speed.array;
        updateGeomData(positions, speeds, range);
        const points = new THREE.Points(geom, material);
        scene.add(points);

        const animate = () => {
            updateGeomData(positions, speeds, range, true);
            geom.attributes.position.needsUpdate = true;
            geom.attributes.speed.needsUpdate = true;
        }
        fn(points, animate);
    });
}