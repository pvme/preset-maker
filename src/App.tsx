import React from 'react';
import { HeaderBar } from './components/HeaderBar/HeaderBar';
import { PresetSection } from './components/PresetSection/PresetSection';

import './App.css';
import './Dialog.css';

function App (): JSX.Element {
  return (
    <div className="App">
      <HeaderBar />
      <PresetSection />
    </div>
  );
}

export default App;