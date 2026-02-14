import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { V1Scene } from './pages/V1Scene';
import { TechScene } from './pages/TechScene';
import { NeuralScene } from './pages/NeuralScene';
import { SnowScene } from './pages/SnowScene';
import { CoasterScene } from './pages/CoasterScene';

import { ConfigPage } from './pages/ConfigPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/v1" element={<V1Scene />} />
        <Route path="/tech" element={<TechScene />} />
        <Route path="/neural" element={<NeuralScene />} />
        <Route path="/snow" element={<SnowScene />} />
        <Route path="/coaster" element={<CoasterScene />} />
        {/* Default to V1 (mountain cinematic) */}
        <Route path="/" element={<Navigate to="/v1" replace />} />
        <Route path="*" element={<Navigate to="/v1" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
