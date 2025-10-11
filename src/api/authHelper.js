export const logoutUser = () => {
    localStorage.removeItem('token');
    window.location.href = '/'; // force redirect
  };
  