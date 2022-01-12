import * as THREE from 'three';

const vertexs = {
    normal_vertex: "\n  precision lowp float;\n  precision lowp int;\n  "
        .concat(THREE.ShaderChunk.fog_pars_vertex, "\n  varying vec2 vUv;\n  void main() {\n    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n    vUv = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n    ").concat(THREE.ShaderChunk.fog_vertex, "\n  }\n"),
}

const fragments = {
    rippleWall_fragment: "\n  precision lowp float;\n  precision lowp int;\n  uniform float time;\n  uniform float opacity;\n  uniform vec3 color;\n  uniform float num;\n  uniform float hiz;\n\n  varying vec2 vUv;\n\n  void main() {\n    vec4 fragColor = vec4(0.);\n    float sin = sin((vUv.y - time * hiz) * 10. * num);\n    float high = 0.92;\n    float medium = 0.4;\n    if (sin > high) {\n      fragColor = vec4(mix(vec3(.8, 1., 1.), color, (1. - sin) / (1. - high)), 1.);\n    } else if(sin > medium) {\n      fragColor = vec4(color, mix(1., 0., 1.-(sin - medium) / (high - medium)));\n    } else {\n      fragColor = vec4(color, 0.);\n    }\n\n    vec3 fade = mix(color, vec3(0., 0., 0.), vUv.y);\n    fragColor = mix(fragColor, vec4(fade, 1.), 0.85);\n    gl_FragColor = vec4(fragColor.rgb, fragColor.a * opacity * (1. - vUv.y));\n  }\n",
}

/**
 * 根据底面各个连接点位的坐标，以及高度；生成不包含上、下两个面的BufferGeometry;默认垂直于x\z平面
 *
 * @param {[number,number,number][]} points
 * @param {number} height
 */
function createBoxWithOutTopAndBottom(points: [number, number, number][], height: number) {
    const joinLonLat: number[] = [];
    const positionsV: { x: number, y: number, z: number }[] = [];
    points.forEach(item => {
        joinLonLat.push(item[0], item[2]);
        positionsV.push({
            x: item[0],
            y: 0,
            z: item[2]
        })
    });
    for (var a = joinLonLat, polySub: number[] = [], o = 0, s = 0; o < a.length - 2; o += 2, s++)
        0 === o ?
            polySub[0] = Math.sqrt((a[2] - a[0]) * (a[2] - a[0]) + (a[3] - a[1]) * (a[3] - a[1])) :
            polySub[s] = polySub[s - 1] + Math.sqrt((a[o + 2] - a[o]) * (a[o + 2] - a[o]) + (a[o + 3] - a[o + 1]) * (a[o + 3] - a[o + 1]));
    let pos: number[] = [],
        uvs: number[] = [];
    let polylenth = polySub[polySub.length - 1];
    for (let d = 0, u = pos.length, p = uvs.length; d < positionsV.length - 1; d++) {
        let pv1 = positionsV[d],
            pv2 = positionsV[d + 1],
            polyPice = polySub[d];
        pos[u++] = pv1.x;
        pos[u++] = 0;
        pos[u++] = pv1.z;
        uvs[p++] = 0 === d ? 0 : polySub[d - 1] / polylenth;
        uvs[p++] = 0;
        pos[u++] = pv2.x;
        pos[u++] = 0;
        pos[u++] = pv2.z;
        uvs[p++] = polyPice / polylenth;
        uvs[p++] = 0;
        pos[u++] = pv1.x;
        pos[u++] = height;
        pos[u++] = pv1.z;
        uvs[p++] = 0 === d ? 0 : polySub[d - 1] / polylenth;
        uvs[p++] = 1;
        pos[u++] = pv1.x;
        pos[u++] = height;
        pos[u++] = pv1.z;
        uvs[p++] = 0 === d ? 0 : polySub[d - 1] / polylenth;
        uvs[p++] = 1;
        pos[u++] = pv2.x;
        pos[u++] = 0;
        pos[u++] = pv2.z;
        uvs[p++] = polyPice / polylenth;
        uvs[p++] = 0;
        pos[u++] = pv2.x;
        pos[u++] = height;
        pos[u++] = pv2.z;
        uvs[p++] = polyPice / polylenth;
        uvs[p++] = 1
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    return geometry;
}

// eslint-disable-next-line import/no-anonymous-default-export
export default function (opts) {
    const {
        height = 5,
        color = '#0099FF',
        num = 5,
        hiz = 0.15,
        opacity = 0.5,
        speed = 0.015,
        positions = []
    } = opts;

    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: {
                value: speed,
            },
            color: {
                value: new THREE.Color(color)
            },
            opacity: {
                value: opacity
            },
            num: {
                value: num
            },
            hiz: {
                value: hiz
            }
        },
        vertexShader: vertexs.normal_vertex,
        fragmentShader: fragments.rippleWall_fragment,
        blending: THREE.AdditiveBlending,
        transparent: !0,
        depthWrite: !1,
        depthTest: !0,
        side: THREE.DoubleSide
    })

    const mesh = new THREE.Mesh(createBoxWithOutTopAndBottom(positions, height), material);
    return mesh;
}