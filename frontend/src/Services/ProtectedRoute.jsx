// Shows the login page until someone signs in, then the app for that user's role.
import { useAuthContext } from '../Context/Auth';
import Login from '../Pages/Login';

const ProtectedRoute = ({ children }) => {
  const { user, signOut } = useAuthContext();

  if (!user) return <Login />;

  return (
    <>
      <div className="signed-in">
        <span>{user.name}</span>
        <button type="button" onClick={signOut}>Sign out</button>
      </div>
      {children(user.role)}
    </>
  );
};

export default ProtectedRoute;
