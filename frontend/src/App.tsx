import { AuthProvider, useAuth } from './store/AuthContext';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Admin />;
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
