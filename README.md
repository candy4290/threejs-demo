## three.js

### 使用typescript4.3.4

### three.js使用右手坐标系（x正方向向右，y正方向向上，z正方向指向屏幕外面）

### 问题及解决思路记录
 - 1.three.meshline实现有宽度的线，但是存在问题，需要修改第三方包的代码 https://github.com/spite/THREE.MeshLine/issues/139
 - 0.通过light.target属性，让平行光追踪物体
 - 1.hover效果/outline（未生效原因解决,需要修改第三方包的代码：https://www.jianshu.com/p/5563645b7e15）
 或者：EffectComposer.readBuffer.texture.encoding = renderer.outputEncoding;
 - 2.轨迹如何画（要求直线连接点）
 - TubeGeometry可能导致未包含所有顶点----因为均匀分段后未必经过顶点
TubeGeometry如何才能包含所有生成curve的点？？？？
导航线如何绘制？

 - 3.gps坐标与模型上坐标映射(
 只需要在模型中设立中心点位的坐标以及比例尺(目前1:1)以及旋转角度
 问题：模型上坐标如何推导出gps坐标
 )
 - 4.模型上距离测算
 - 5.视角跟随（已经单位向量切线、向量的切线的终点、模、求解向量切线的起点）
 - 6.始终面向相机的POI注释
 - 7.天空盒准备（一个下拉列表/白天-黑夜-下雨-下雪-阴天）
 - 8.效果展示（泛光-扫描-水波纹扩散-动态符号线/符号线流动-动态线流-光锥-墙贴图动画-模型  线框-鼠标右击功能开发-相机自动迅游）
 - 9.小地图展示---renderer开启剪裁检测，使用一个额外的camera
 - 10.欧拉角
 - 11.摄像机从一个点飞到另外一个点的效果制作（flyTo）:利用tween.js
 - 12.css3dobject,需要WebGLRenderer背景透明，且不可以设置clearColor;controls中的参数，需要设置为CSS3DRenderer示例的domElement；css3dobject会永远覆盖在wegglrenderer渲染场景内容的上层；

可以做的思路：  
- 使用天空盒（6张图）和等矩形贴图以及HDR贴图(RGBELoader)可以制作3d背景
- 基于Raycaster的碰撞检测
- 立体浮雕效果和视差屏障效果AnaglyphEffect
- 双屏渲染效果StereoEffect
- VertexTangentsHelper-切线辅助对象
- VertexNormalsHelper-法线辅助对象
- MeshSurfaceSampler-均匀分散到物体表面
- layers----摄像机可以只渲染某个层级的物体
- LensflareElement----模拟太阳光的光晕/炫光效果
- 光照探针
- TWEEN-实现聚光灯移动、变向等效果
- 多材质切换：KHR_materials_variants插件
- 将图片加载为纹理：ImageLoader
- MD2模型是一种古老的支持帧动画的模型格式
- 将物体缓慢转动到某个方向：webgl_math_orientation_transform.html
- 使用Reflector创建镜子
- 让文字验证三维曲线运动：CurveModifier
- 下雪：可以使用贴图实现-webgl_points_sprites.html
- 水面：jsm/objects/Water2.js
- 运动幻影效果处理:AfterimagePass
- 背景虚拟化模糊：jsm/postprocessing/BokehPass.js
- 泛光/炫光 效果：UnrealBloomPass
- 声音相关：webaudio
- 我们的底图效果，应该使用MapControls
- 拖拽效果思路：
three.js中进行拖拽-----TransformControls+导出成gltf(将一个scene导出来)
凹凸贴图: 使纹理有厚度-看起来更加立体，凹凸贴图一般使用一张灰度图，设置成材料的bumpMap属性
- *法向贴图: 使用一张法向图来表示纹理图片某个点的法向量。即用一张图片保存另一张图片的法向量信息，
         * 然后再在threejs中将这两个图片的信息合在一起，就形成了一个细节丰富的立体纹理
         * 设置材质的 normalMap 属性




需要看的东西：
- 1.ShaderMaterial
- 2.webgl_geometry_extrude_splines
- 3.法线贴图
 
fxaa效果一般、开销很小，无法解决线的锯齿问题，带来模糊  
SSAA：效果最好，开销太大  
taa: 有动画时失效  

getPoint&getPointAt区别：https://discourse.threejs.org/t/curve-difference-between-getpoint-and-getpointat-methods/6637/2  
模型闪烁问题处理：renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });---但是这样会造成卡顿  

### 天空盒
'右.jpg', /* 右-px */
'左.jpg', /* 左-nx */
'顶.jpg', /* 顶-py */
'底.jpg', /* 底-ny */
'后.jpg', /* 后-pz */
'前.jpg' /* 前-nz */

### UV贴图
一个点需要一个uv值。
- u:图片在显示器水平的坐标  
- v:图片在显示器垂直的坐标

### 着色器材质内置变量
- gl_PointSize  
gl_PointSize内置变量是一个float类型，在点渲染模式中，顶点由于是一个点，理论上我们并无法看到，所以他是以一个正对着相机的正方形面表现的。使用内置变量gl_PointSize主要是用来设置顶点渲染出来的正方形面的相素大小（默认值是0）。
void main() {
  gl_PointSize = 10.0；
}
- gl_Position  
gl_Position内置变量是一个vec4类型，它表示最终传入片元着色器片元化要使用的顶点位置坐标。vec4(x,y,z,1.0),前三个参数表示顶点的xyz坐标值，第四个参数是浮点数1.0。
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
- gl_FragColor  
gl_FragColor内置变量是vec4类型，主要用来设置片元像素的颜色，它的前三个参数表示片元像素颜色值RGB，第四个参数是片元像素透明度A，1.0表示不透明,0.0表示完全透明。
void main() {
	gl_FragColor = vec4(1.0,0.0,0.0,1.0);
}
- gl_FragCoord  
gl_FragCoord内置变量是vec2类型，它表示WebGL在canvas画布上渲染的所有片元或者说像素的坐标，坐标原点是canvas画布的左上角，x轴水平向右，y竖直向下，gl_FragCoord坐标的单位是像素，gl_FragCoord的值是vec2(x,y),通过gl_FragCoord.x、gl_FragCoord.y方式可以分别访问片元坐标的纵横坐标。
- gl_PointCoord  
gl_PointCoord内置变量也是vec2类型，同样表示像素的坐标，但是与gl_FragCoord不同的是，gl_FragCoord是按照整个canvas算的x值从[0,宽度]，y值是从[0,高度]。而gl_PointCoord是在点渲染模式中生效的，而它的范围是对应小正方形面，同样是左上角[0,0]到右下角[1,1]。

### glsl内置函数
- mod(x,y)  
原理x%y(即取余数)

### LOD
多细节层次 —— 在显示网格时，根据摄像机距离物体的距离，来使用更多或者更少的几何体来对其进行显示。

### jsx标签注释
``` javascript
 {
    /* 
    <div className={`${prefix}-first-right`} onClick={goWisdomSearch}>
        <span>智能搜索</span>
        <RightOutlined style={{transform: 'scale(0.75)'}} />
    </div>
    */
}
```

### ie兼容处理
npm install @babel/polyfill --save
npm install --save core-js@3
app.js顶部引入import '@babel/polyfill'

### vscode插件推荐
Auto Rename Tag  
Color Picker  
Debugger for Chrome  
Document This  
Eclipse Keymap  
EditorConfig for VS Code  
ENV  
ESLint  
file-icons  
Git History  
gitignore  
JavaScript(ES6) code snippets  
Prettier - Code formatter  
React/Redux/react-router Snippets  
Svg Preview  
TODO Highlight  
vscode-json  
Path Intellisense 用来处理路径别名，在vscode中可以自动提示，跳转等功能

``` javascript
/**
 * @author spidersharma / http://eduperiment.com/
 *
 * Inspired from Unreal Engine
 * https://docs.unrealengine.com/latest/INT/Engine/Rendering/PostProcessEffects/Bloom/
 */

 import {
	AdditiveBlending,
	Color,
	LinearFilter,
	MeshBasicMaterial,
	RGBAFormat,
	ShaderMaterial,
	UniformsUtils,
	Vector2,
	Vector3,
	WebGLRenderTarget
} from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { LuminosityHighPassShader } from 'three/examples/jsm/shaders/LuminosityHighPassShader.js';

class UnrealBloomPass extends Pass {
	constructor(resolution, strength, radius, threshold, selectedObjects, scene, camera) {

		super();

		this.strength = (strength !== undefined) ? strength : 1;
		this.radius = radius;
		this.threshold = threshold;
		this.resolution = (resolution !== undefined) ? new Vector2(resolution.x, resolution.y) : new Vector2(256, 256);

		this.scene = scene;
		this.camera = camera;
		this.selectedObjects = selectedObjects || [];
		// create color only once here, reuse it later inside the render function
		this.clearColor = new Color(0, 0, 0);

		// render targets
		var pars = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat };
		this.renderTargetsHorizontal = [];
		this.renderTargetsVertical = [];
		this.nMips = 5;
		var resX = Math.round(this.resolution.x / 2);
		var resY = Math.round(this.resolution.y / 2);

		this.renderTargetSelectedObjects = new WebGLRenderTarget(resX, resY, pars);
		this.renderTargetSelectedObjects.texture.name = "UnrealBloomPass.selectedObjects";
		this.renderTargetSelectedObjects.texture.generateMipmaps = false;

		this.renderTargetBright = new WebGLRenderTarget(resX, resY, pars);
		this.renderTargetBright.texture.name = "UnrealBloomPass.bright";
		this.renderTargetBright.texture.generateMipmaps = false;
		for (var i = 0; i < this.nMips; i++) {

			var renderTargetHorizonal = new WebGLRenderTarget(resX, resY, pars);

			renderTargetHorizonal.texture.name = "UnrealBloomPass.h" + i;
			renderTargetHorizonal.texture.generateMipmaps = false;

			this.renderTargetsHorizontal.push(renderTargetHorizonal);

			var renderTargetVertical = new WebGLRenderTarget(resX, resY, pars);

			renderTargetVertical.texture.name = "UnrealBloomPass.v" + i;
			renderTargetVertical.texture.generateMipmaps = false;

			this.renderTargetsVertical.push(renderTargetVertical);

			resX = Math.round(resX / 2);

			resY = Math.round(resY / 2);

		}

		// luminosity high pass material

		if (LuminosityHighPassShader === undefined)
			console.error("UnrealBloomPass relies on LuminosityHighPassShader");

		var highPassShader = LuminosityHighPassShader;
		this.highPassUniforms = UniformsUtils.clone(highPassShader.uniforms);

		this.highPassUniforms["luminosityThreshold"].value = threshold;
		this.highPassUniforms["smoothWidth"].value = 0.01;

		this.materialHighPassFilter = new ShaderMaterial({
			uniforms: this.highPassUniforms,
			vertexShader: highPassShader.vertexShader,
			fragmentShader: highPassShader.fragmentShader,
			defines: {}
		});

		// Gaussian Blur Materials
		this.separableBlurMaterials = [];
		var kernelSizeArray = [3, 5, 7, 9, 11];
		var resX = Math.round(this.resolution.x / 2);
		var resY = Math.round(this.resolution.y / 2);

		for (var i = 0; i < this.nMips; i++) {

			this.separableBlurMaterials.push(this.createSeperableBlurMaterial(kernelSizeArray[i]));

			this.separableBlurMaterials[i].uniforms["texSize"].value = new Vector2(resX, resY);

			resX = Math.round(resX / 2);

			resY = Math.round(resY / 2);

		}

		// Composite material
		this.bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];
		this.bloomTintColors = [
			new Vector3(1, 1, 1),
			new Vector3(1, 1, 1),
			new Vector3(1, 1, 1),
			new Vector3(1, 1, 1),
			new Vector3(1, 1, 1)
		];

		this.compositeMaterial = this.createCompositeMaterial(this.nMips);

		this.blendMaterial = this.createBlendMaterial();

		// copy material
		if (CopyShader === undefined) {

			console.error("UnrealBloomPass relies on CopyShader");

		}

		var copyShader = CopyShader;

		this.copyUniforms = UniformsUtils.clone(copyShader.uniforms);
		this.copyUniforms["opacity"].value = 1.0;

		this.materialCopy = new ShaderMaterial({
			uniforms: this.copyUniforms,
			vertexShader: copyShader.vertexShader,
			fragmentShader: copyShader.fragmentShader,
			blending: AdditiveBlending,
			depthTest: false,
			depthWrite: false,
			transparent: true
		});

		this.enabled = true;
		this.needsSwap = false;

		this.oldClearColor = new Color();
		this.oldClearAlpha = 1;

		this.basic = new MeshBasicMaterial();

		this.fsQuad = new FullScreenQuad(null);
	}

	dispose() {

		for (var i = 0; i < this.renderTargetsHorizontal.length; i++) {

			this.renderTargetsHorizontal[i].dispose();

		}

		for (var i = 0; i < this.renderTargetsVertical.length; i++) {

			this.renderTargetsVertical[i].dispose();

		}

		this.renderTargetBright.dispose();

	}

	setSize(width, height) {

		var resX = Math.round(width / 2);
		var resY = Math.round(height / 2);

		this.renderTargetBright.setSize(resX, resY);

		for (var i = 0; i < this.nMips; i++) {

			this.renderTargetsHorizontal[i].setSize(resX, resY);
			this.renderTargetsVertical[i].setSize(resX, resY);

			this.separableBlurMaterials[i].uniforms["texSize"].value = new Vector2(resX, resY);

			resX = Math.round(resX / 2);
			resY = Math.round(resY / 2);

		}

	}

	render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
		// console.log(renderer.getClearColor())
		// this.oldClearColor.copy(renderer.getClearColor());
		renderer.getClearColor( this.oldClearColor );
		this.oldClearAlpha = renderer.getClearAlpha();
		var oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		renderer.setClearColor(this.clearColor, 0);

		if (maskActive) renderer.state.buffers.stencil.setTest(false);

		if (this.renderToScreen) {

			this.fsQuad.material = this.basic;
			if (this.basic.map === null) this.basic.map = readBuffer.texture;

			renderer.setRenderTarget(null);
			renderer.clear();
			this.fsQuad.render(renderer);

		}

		var applyBuffer = readBuffer;

		if (this.selectedObjects.length > 0) {

			this.changeVisibilityOfNonSelectedObjects(false);

			renderer.setRenderTarget(this.renderTargetSelectedObjects);
			renderer.clear();
			renderer.render(this.scene, this.camera);

			applyBuffer = this.renderTargetSelectedObjects;

			this.changeVisibilityOfNonSelectedObjects(true);

		}

		// 1. Extract Bright Areas
		this.highPassUniforms["tDiffuse"].value = applyBuffer.texture;
		this.highPassUniforms["luminosityThreshold"].value = this.threshold;
		this.fsQuad.material = this.materialHighPassFilter;

		renderer.setRenderTarget(this.renderTargetBright);
		renderer.clear();
		this.fsQuad.render(renderer);

		// 2. Blur All the mips progressively
		var inputRenderTarget = this.renderTargetBright;

		for (var i = 0; i < this.nMips; i++) {

			this.fsQuad.material = this.separableBlurMaterials[i];

			this.separableBlurMaterials[i].uniforms["colorTexture"].value = inputRenderTarget.texture;
			this.separableBlurMaterials[i].uniforms["direction"].value = UnrealBloomPass.BlurDirectionX;
			renderer.setRenderTarget(this.renderTargetsHorizontal[i]);
			renderer.clear();
			this.fsQuad.render(renderer);

			this.separableBlurMaterials[i].uniforms["colorTexture"].value = this.renderTargetsHorizontal[i].texture;
			this.separableBlurMaterials[i].uniforms["direction"].value = UnrealBloomPass.BlurDirectionY;
			renderer.setRenderTarget(this.renderTargetsVertical[i]);
			renderer.clear();
			this.fsQuad.render(renderer);

			inputRenderTarget = this.renderTargetsVertical[i];

		}

		// Composite All the mips

		this.fsQuad.material = this.compositeMaterial;
		this.compositeMaterial.uniforms["bloomStrength"].value = this.strength;
		this.compositeMaterial.uniforms["bloomRadius"].value = this.radius;
		this.compositeMaterial.uniforms["bloomTintColors"].value = this.bloomTintColors;

		renderer.setRenderTarget(this.renderTargetsHorizontal[0]);
		renderer.clear();
		this.fsQuad.render(renderer);

		if (this.selectedObjects.length > 0) {

			this.fsQuad.material = this.blendMaterial;
			this.blendMaterial.uniforms['baseTexture'].value = readBuffer.texture;
			// this.blendMaterial.uniforms[ "bloomTexture" ].value = this.renderTargetsHorizontal[ 0 ].texture;

		} else {

			// Blend it additively over the input texture
			this.fsQuad.material = this.materialCopy;
			this.copyUniforms["tDiffuse"].value = this.renderTargetsHorizontal[0].texture;

		}

		if (maskActive) renderer.state.buffers.stencil.setTest(true);

		if (this.renderToScreen) {

			renderer.setRenderTarget(null);
			this.fsQuad.render(renderer);

		} else {

			renderer.setRenderTarget(readBuffer);
			this.fsQuad.render(renderer);

		}

		// Restore renderer settings
		renderer.setClearColor(this.oldClearColor, this.oldClearAlpha);
		renderer.autoClear = oldAutoClear;

	}

	createBlendMaterial() {

		return new ShaderMaterial({
			uniforms: {
				baseTexture: { value: null },
				bloomTexture: { value: this.renderTargetsHorizontal[0].texture },
			},

			vertexShader: `
            varying vec2 vUv;
 
            void main() {
 
                vUv = uv;
 
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
 
            }
            `,

			fragmentShader:
				`
            uniform sampler2D baseTexture;
            uniform sampler2D bloomTexture;
 
            varying vec2 vUv;
 
            void main() {
 
                // vec4 texel1 = texture2D( baseTexture, vUv );
                // vec4 texel2 = texture2D( bloomTexture, vUv );
                // gl_FragColor = mix( texel1, texel2, 0.5 );
 
                gl_FragColor = texture2D( baseTexture , vUv ) + vec4( 1.0 ) * texture2D( bloomTexture , vUv );
				// gl_FragColor.a =  texture2D( baseTexture ).a; // THIS did it
 
            }
            `
		});

	}

	createSeperableBlurMaterial(kernelRadius) {

		return new ShaderMaterial({

			defines: {
				"KERNEL_RADIUS": kernelRadius,
				"SIGMA": kernelRadius
			},

			uniforms: {
				"colorTexture": { value: null },
				"texSize": { value: new Vector2(0.5, 0.5) },
				"direction": { value: new Vector2(0.5, 0.5) }
			},

			vertexShader:
				"varying vec2 vUv;\n\
                void main() {\n\
                    vUv = uv;\n\
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
                }",

			fragmentShader:
				"#include <common>\
                varying vec2 vUv;\n\
                uniform sampler2D colorTexture;\n\
                uniform vec2 texSize;\
                uniform vec2 direction;\
                \
                float gaussianPdf(in float x, in float sigma) {\
                    return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;\
                }\
                void main() {\n\
                    vec2 invSize = 1.0 / texSize;\
                    float fSigma = float(SIGMA);\
                    float weightSum = gaussianPdf(0.0, fSigma);\
                    vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;\
                    for( int i = 1; i < KERNEL_RADIUS; i ++ ) {\
                        float x = float(i);\
                        float w = gaussianPdf(x, fSigma);\
                        vec2 uvOffset = direction * invSize * x;\
                        vec3 sample1 = texture2D( colorTexture, vUv + uvOffset).rgb;\
                        vec3 sample2 = texture2D( colorTexture, vUv - uvOffset).rgb;\
                        diffuseSum += (sample1 + sample2) * w;\
                        weightSum += 2.0 * w;\
                    }\
                    gl_FragColor = vec4(diffuseSum/weightSum, 1.0);\n\
                }"
		});

	}

	createCompositeMaterial(nMips) {

		return new ShaderMaterial({

			defines: {
				"NUM_MIPS": nMips
			},

			uniforms: {
				blurTexture0: { value: this.renderTargetsVertical[0].texture },
				blurTexture1: { value: this.renderTargetsVertical[1].texture },
				blurTexture2: { value: this.renderTargetsVertical[2].texture },
				blurTexture3: { value: this.renderTargetsVertical[3].texture },
				blurTexture4: { value: this.renderTargetsVertical[4].texture },
				bloomStrength: { value: this.strength },
				bloomFactors: { value: this.bloomFactors },
				bloomTintColors: { value: this.bloomTintColors },
				bloomRadius: { value: this.radius }
			},

			vertexShader:
				"varying vec2 vUv;\n\
                void main() {\n\
                    vUv = uv;\n\
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
                }",

			fragmentShader:
				"varying vec2 vUv;\
                uniform sampler2D blurTexture0;\
                uniform sampler2D blurTexture1;\
                uniform sampler2D blurTexture2;\
                uniform sampler2D blurTexture3;\
                uniform sampler2D blurTexture4;\
                uniform float bloomStrength;\
                uniform float bloomRadius;\
                uniform float bloomFactors[NUM_MIPS];\
                uniform vec3 bloomTintColors[NUM_MIPS];\
                \
                float lerpBloomFactor(const in float factor) { \
                    float mirrorFactor = 1.2 - factor;\
                    return mix(factor, mirrorFactor, bloomRadius);\
                }\
                \
                void main() {\
                    gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture0, vUv) + \
                                                    lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture1, vUv) + \
                                                    lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture2, vUv) + \
                                                    lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture3, vUv) + \
                                                    lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture4, vUv) );\
                }"
		});

	}

	changeVisibilityOfNonSelectedObjects(bVisible) {

		var self = this;

		this.scene.traverse(function (child) {
			if (child.isMesh && !self.selectedObjects.includes(child)) {

				child.visible = bVisible;
				// child.material.colorWrite = bVisible;

			}

		});

	}




};

UnrealBloomPass.BlurDirectionX = new Vector2(1.0, 0.0);
UnrealBloomPass.BlurDirectionY = new Vector2(0.0, 1.0);

export { UnrealBloomPass };
```