import { useEffect } from "react"
import * as THREE from 'three';
import { MapControls, OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * glsl内置函数：https://www.mrguo.link/article?id=32
 * 着色器材质变量
 * Uniforms是所有顶点都具有相同的值的变量。 比如灯光，雾，和阴影贴图就是被储存在uniforms中的数据。 uniforms可以通过顶点着色器和片元着色器来访问。
 * Varyings 是从顶点着色器传递到片元着色器的变量。因此需要在两个着色器中同时定义，对于每一个片元，每一个varying的值将是相邻顶点值的平滑插值。
 * Attributes 与每个顶点关联的变量。例如，顶点位置，法线和顶点颜色都是存储在attributes中的数据。attributes 只可以在顶点着色器中访问。
 * 
 * 
 * projectionMatrix、modelViewMatrix和position都是three为我们设置好的变量，可以直接拿来用，前两个变量我们之前已经说了，而position就是每一个顶点的坐标值，
 * 当着色器代码执行时，会循环执行gl_Position和gl_FragColor设置顶点位置，和颜色插值。并且我们最终要设置的就是gl_Position和gl_FragCol
 * @export
 * @return {*} 
 */
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
const StartTime = {
    value: 0
};
const clock = new THREE.Clock();

export default function Glsl2() {
    
    useEffect(() => {
        init();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();
        scene.add(new THREE.AxesHelper(100))
        camera = new THREE.PerspectiveCamera();
        camera.position.set(100,100,100)
        renderer = new THREE.WebGLRenderer({canvas});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        controls = new OrbitControls(camera, renderer.domElement);

        const shape = new THREE.Shape();
        shape.moveTo(-10, 20);
        shape.absarc(0, 20, 10,  Math.PI, Math.PI * 2, true);
        shape.lineTo(10, -20);
        shape.absarc(0, -20, 10, 0, Math.PI, true );
        shape.lineTo(-10, 20);

        var extrudeSettings = {
            steps: 2, //用于沿着挤出样条的深度细分的点的数量，默认值为1
            depth: 5, //挤出的形状的深度，默认值为100
            bevelEnabled: true, //对挤出的形状应用是否斜角，默认值为true
            bevelThickness: 1, //设置原始形状上斜角的厚度。默认值为6
            bevelSize: 1, //斜角与原始形状轮廓之间的延伸距离
            bevelSegments: 10, //斜角的分段层数，默认值为3
            curveSegments: 12, //曲线上点的数量，默认值是12
        };
        var frame = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // var material = new THREE.MeshPhongMaterial({color: 0x222222, emissive: 0x222222});
        var cylinGeom = new THREE.CylinderGeometry(6, 6, 6, 30, 20);
        frame.merge(cylinGeom.clone(), new THREE.Matrix4().compose(new THREE.Vector3(0, 15, 3.1), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2), new THREE.Vector3(1,1,1)) as any);
        frame.merge(cylinGeom.clone(), new THREE.Matrix4().compose(new THREE.Vector3(0, 0, 3.1), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2), new THREE.Vector3(1,1,1)) as any);
        frame.merge(cylinGeom.clone(), new THREE.Matrix4().compose(new THREE.Vector3(0, -15, 3.1), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2), new THREE.Vector3(1,1,1)) as any);

        const mate = new THREE.ShaderMaterial({ 
            uniforms: {
                time: StartTime
            },
            vertexShader: ` 
                // 顶点着色器--这里我们定义一个三维向量vPosition，用来将顶点着色器里面的position属性传递到片元着色器中（three.js会默认传入一些属性，像uv,position,normal等）
                varying vec3 vPosition;
                uniform float time;
                void main() {
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
            `,
            fragmentShader: `
                varying vec3 vPosition;
                uniform float time;
                void main() {
                    float time = mod(time, 3.0);//time值对3取模，得到[0,3)范围内的值。
                    gl_FragColor=vec4(1.0, 0.0, 0.0, 1.0);
                        //由于我们制作红绿灯时用了小技巧，让其z分量比较大，所以可以根据z的值判断是否为红绿灯面。然后在根据y值，判断为哪个灯。
                    if(vPosition.z == 6.1 && vPosition.y > 8.0) {
                        gl_FragColor=vec4(1.0, 0.7, 0.0, 1.0);
                        if(time < 1.0) {//时间为[0,1)红灯
                            gl_FragColor=vec4(1.0, 0.0, 0.0, 1.0);
                        } else {
                            gl_FragColor=vec4(0.2, 0.0, 0.0, 1.0);
                        }
                    } else if(vPosition.z == 6.1 && vPosition.y > -8.0) {//时间为[1,2)黄灯
                        gl_FragColor=vec4(1.0, 0.7, 0.0, 1.0);
                        if(time >= 1.0 && time < 2.0) {
                            gl_FragColor=vec4(1.0, 0.7, 0.0, 1.0);
                        } else {
                            gl_FragColor=vec4(0.2, 0.1, 0.0, 1.0);
                        }
                    } else if(vPosition.z == 6.1) {//时间为[2,3)绿灯
                        if(time >= 2.0) {
                            gl_FragColor=vec4(0.0, 1.0, 0.0, 1.0);
                        } else {
                            gl_FragColor=vec4(0.0, 0.2, 0.0, 1.0);
                        }
                    } else {//其余部分为灰色
                        gl_FragColor=vec4(0.2, 0.2, 0.2, 1.0);
                    }
                }
            `
        })

        const mesh = new THREE.Mesh(frame, mate);
        scene.add(mesh)
        render()
    }
    function render() {
        // const dt = clock.getDelta();
        StartTime.value += 0.1;
        requestAnimationFrame(render);
        controls.update();
        renderer.render(scene, camera);
    }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}