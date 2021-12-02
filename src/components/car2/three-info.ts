import axios from 'axios';
import * as THREE from 'three';

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