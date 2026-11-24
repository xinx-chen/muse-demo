import { AppProvider, useApp } from '@/store/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { NotesView } from '@/components/NotesView';
import { MemoryView } from '@/components/MemoryView';
import { GraphView } from '@/components/GraphView';

function Main() {
  const { view } = useApp();

  return (
    <div className="h-full flex">
      <Sidebar />
      {view === 'chat' && <ChatArea />}
      {view === 'notes' && <NotesView />}
      {view === 'memory' && <MemoryView />}
      {view === 'graph' && <GraphView />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}
