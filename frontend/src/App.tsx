import { useState } from 'react';
import { Navbar } from './layouts/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectWorkspacePage } from './pages/ProjectWorkspacePage';
import { ProjectModal } from './components/ProjectModal';
import { api } from './services/api';

export function App() {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | undefined>(undefined);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const handleOpenProject = async (projectId: string) => {
    try {
      const proj = await api.getProject(projectId);
      setCurrentProjectId(projectId);
      setCurrentProjectName(proj.name);
    } catch (err) {
      setCurrentProjectId(projectId);
    }
  };

  const handleNavigateHome = () => {
    setCurrentProjectId(null);
    setCurrentProjectName(undefined);
  };

  const handleProjectCreated = (newProjectId: string) => {
    handleOpenProject(newProjectId);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentProjectName={currentProjectName}
        onNavigateHome={handleNavigateHome}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {currentProjectId ? (
          <ProjectWorkspacePage
            projectId={currentProjectId}
            onNavigateHome={handleNavigateHome}
          />
        ) : (
          <DashboardPage
            onOpenProject={handleOpenProject}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
          />
        )}
      </main>

      <ProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}

export default App;
