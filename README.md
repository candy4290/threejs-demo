## three.js

### 使用typescript4.3.4

### three.js使用右手坐标系（x正方向向右，y正方向向上，z正方向指向屏幕外面）

### 问题及解决思路记录
 -1.three.meshline实现有宽度的线，但是存在问题，需要修改第三方包的代码 https://github.com/spite/THREE.MeshLine/issues/139
 0.通过light.target属性，让平行光追踪物体
 1.hover效果/outline（未生效原因解决,需要修改第三方包的代码：https://www.jianshu.com/p/5563645b7e15）
 2.轨迹如何画（要求直线连接点）
TubeGeometry可能导致未包含所有顶点----因为均匀分段后未必经过顶点
TubeGeometry如何才能包含所有生成curve的点？？？？
导航线如何绘制？

 3.gps坐标与模型上坐标映射(
 只需要在模型中设立中心点位的坐标以及比例尺(目前1:1)以及旋转角度
 问题：模型上坐标如何推导出gps坐标
 )
 4.模型上距离测算
 5.视角跟随（已经单位向量切线、向量的切线的终点、模、求解向量切线的起点）
 6.始终面向相机的POI注释
 7.天空盒准备（一个下拉列表/白天-黑夜-下雨-下雪-阴天）
 8.效果展示（泛光-扫描-水波纹扩散-动态符号线/符号线流动-动态线流-光锥-墙贴图动画-模型  线框-鼠标右击功能开发-相机自动迅游）
 9.小地图展示---renderer开启剪裁检测，使用一个额外的camera
 10.欧拉角
11.摄像机从一个点飞到另外一个点的效果制作（flyTo）

可以做的思路：
使用天空盒（6张图）和等矩形贴图以及HDR贴图(RGBELoader)可以制作3d背景
基于Raycaster的碰撞检测
立体浮雕效果和视差屏障效果AnaglyphEffect
双屏渲染效果StereoEffect
VertexTangentsHelper-切线辅助对象
VertexNormalsHelper-法线辅助对象
MeshSurfaceSampler-均匀分散到物体表面
layers----摄像机可以只渲染某个层级的物体
LensflareElement----模拟太阳光的光晕/炫光效果
光照探针
TWEEN-实现聚光灯移动、变向等效果
多材质切换：KHR_materials_variants插件
将图片加载为纹理：ImageLoader
MD2模型是一种古老的支持帧动画的模型格式
将物体缓慢转动到某个方向：webgl_math_orientation_transform.html
使用Reflector创建镜子
让文字验证三维曲线运动：CurveModifier
下雪：可以使用贴图实现-webgl_points_sprites.html
水面：jsm/objects/Water2.js
运动幻影效果处理:AfterimagePass
背景虚拟化模糊：jsm/postprocessing/BokehPass.js
泛光/炫光 效果：UnrealBloomPass
声音相关：webaudio
我们的底图效果，应该使用MapControls
拖拽效果思路：
three.js中进行拖拽-----TransformControls+导出成gltf(将一个scene导出来)
凹凸贴图: 使纹理有厚度-看起来更加立体，凹凸贴图一般使用一张灰度图，设置成材料的bumpMap属性
*法向贴图: 使用一张法向图来表示纹理图片某个点的法向量。即用一张图片保存另一张图片的法向量信息，
         * 然后再在threejs中将这两个图片的信息合在一起，就形成了一个细节丰富的立体纹理
         * 设置材质的 normalMap 属性




需要看的东西：
1.ShaderMaterial
2.webgl_geometry_extrude_splines
3.法线贴图


### jsx标签注释
 {
    /* 
    <div className={`${prefix}-first-right`} onClick={goWisdomSearch}>
        <span>智能搜索</span>
        <RightOutlined style={{transform: 'scale(0.75)'}} />
    </div>
    */
}

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
