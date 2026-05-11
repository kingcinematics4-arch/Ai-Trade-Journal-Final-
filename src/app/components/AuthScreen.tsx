import React from 'react';
import AuthBrandPanel from './AuthBrandPanel';
import AuthFormPanel from './AuthFormPanel';

export default function AuthScreen() {
  return (
    <div className="min-h-screen bg-background flex">
      <AuthBrandPanel />
      <AuthFormPanel />
    </div>
  );
}