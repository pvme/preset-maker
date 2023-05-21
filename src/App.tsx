import React from 'react';
import { HeaderBar } from './components/HeaderBar/HeaderBar';
import { PresetSection } from './components/PresetSection/PresetSection';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import './App.css';
import './Dialog.css';

function App (): JSX.Element {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <HeaderBar />
        <PresetSection />
      </div>
    </DndProvider>
  );
}

export default App;
