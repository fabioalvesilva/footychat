import React from 'react';
import { IoFootball } from 'react-icons/io5';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-green-600">
      <div className="relative">
        <IoFootball className="w-20 h-20 text-white animate-bounce" />
        <div className="absolute inset-0 w-20 h-20 bg-white/20 rounded-full animate-ping"></div>
      </div>
      <h1 className="text-3xl font-bold text-white mt-6">FootyChat</h1>
      <div className="flex space-x-1 mt-4">
        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-100"></div>
        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-200"></div>
      </div>
    </div>
  );
}

export default LoadingScreen;