import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setAuthToken } from "./lib/axios";
import Dashboard from "./Main_pages/Dashboard";
import ProjectEditor from "./Main_pages/ProjectEditor";

function App() {
  const { getToken, userId } = useAuth();

  useEffect(() => {
    const updateToken = async () => {
      if (userId) {
        const token = await getToken();
        setAuthToken(token);
      } else {
        setAuthToken(null);
      }
    };

    updateToken();
    
    // Refresh token periodically
    const interval = setInterval(updateToken, 1000 * 50); // every 50 seconds
    return () => clearInterval(interval);
  }, [getToken, userId]);

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/projects/:projectId" element={<ProjectEditor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
