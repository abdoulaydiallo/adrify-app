import React from 'react';

export const Loader = () => {
  return (
    <div className="w-full bg-background h-[calc(100vh - 200px)] flex items-center justify-center py-20">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div
          className="absolute inset-0 w-12 h-12 border-4 border-purple-200 border-b-purple-600 rounded-full animate-spin opacity-40"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        ></div>
      </div>
    </div>
  );
};

