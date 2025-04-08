
import React from 'react';

const Login = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border p-6 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">Login</h1>
        <form>
          <div className="mb-4">
            <label className="mb-1 block">Username</label>
            <input 
              type="text" 
              className="w-full rounded border p-2" 
              placeholder="Enter username"
            />
          </div>
          <div className="mb-6">
            <label className="mb-1 block">Password</label>
            <input 
              type="password" 
              className="w-full rounded border p-2" 
              placeholder="Enter password"
            />
          </div>
          <button 
            type="submit" 
            className="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
