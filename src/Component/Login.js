import React, { useState , useEffect  } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/authApi';
import { useAuth } from '../Context/AuthContext';
import { useLoader } from '../Context/LoaderContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showLoader, hideLoader } = useLoader();
  useEffect(() => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    // Optionally clear any global state here
  }, []);
  const handleLogin = async  (e) => {

    const userDetail = {
      userName : email,
      password : password,
    }


    e.preventDefault();
    setError('');
    showLoader(); // Start Loader
    try {
      
      const response = await loginUser(userDetail);
      if (response.data.token == null) {
        toast.error(response.data.errorMessage || 'Login failed.');
        //setError(response?.data?.message || 'Login failed.');
      }
      else
      {
        toast.success('Login Successfully');
        login(response.data.token); // ✅ save token globally
        setTimeout(() => navigate('/Home'), 5000);
      }
    } catch (err) {
      //setError(err.response?.data?.message || 'Login failed.');
      toast.error('Login failed.!');
    }
   finally {
    hideLoader(); // Stop Loader
  }
  };

  return (
    <div className="login-container">
       <ToastContainer position="top-center" autoClose={3000} />
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {error && <p className="error-msg">{error}</p>}
      </form>
      <p>
        Don’t have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default Login;
