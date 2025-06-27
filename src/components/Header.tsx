import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-primary-500 text-white p-4 text-center shadow-md">
      <h1 className="text-2xl font-bold mb-1">ExecHub</h1>
      <p className="text-primary-50 text-sm">Application Profile Manager</p>
    </header>
  );
};

export default Header; 