import React from 'react';
import Toolbar from '@/components/Toolbar';
import MindMapCanvas from '@/components/MindMapCanvas';

export default function Home() {
  return (
    <React.Fragment>
      <Toolbar />
      <MindMapCanvas />
    </React.Fragment>
  );
}
