import React from 'react';
import AuthBrandPanel from './AuthBrandPanel';
import AuthFormPanel from './AuthFormPanel';
import AuthRedirect from './AuthRedirect';

export default function AuthScreen() {
  return (
    <div className="min-h-screen bg-background flex">
      <AuthRedirect />
      <AuthBrandPanel />
      <AuthFormPanel />
    </div>
  );
}