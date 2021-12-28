import * as THREE from 'three';

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
