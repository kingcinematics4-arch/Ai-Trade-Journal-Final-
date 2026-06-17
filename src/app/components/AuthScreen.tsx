import React from 'react';
import AuthBrandPanel from './AuthBrandPanel';
import AuthFormPanel from './AuthFormPanel';
import AuthRedirect from './AuthRedirect';

export default function AuthScreen() {
  return (
    <div id="auth-section" className="min-h-screen flex items-stretch bg-background scroll-mt-20">
      <AuthRedirect />
      <AuthBrandPanel />
      <AuthFormPanel />
    </div>
  );
}
