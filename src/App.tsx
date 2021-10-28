import './App.less';
import { useRef } from 'react';
import { useEffect } from 'react';

import Stats from 'stats.js';
import Car1 from './components/car1';

function App() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    var stats = new Stats();
    // const gpuPanel = new GPUStatsPanel();
    // stats.addPanel( gpuPanel );
    stats.showPanel(0) ; // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.dom );
    
    function animate() {
      stats.begin();
      // monitored code goes here
      stats.end();
      requestAnimationFrame( animate );
    }
    requestAnimationFrame( animate );
  }, []);

  return (
    <div className='kz-kyk' style={{height: '100%', width: '100%'}} ref={mainRef}>
      <Car1 />
    </div>
  );
}

export default App;
