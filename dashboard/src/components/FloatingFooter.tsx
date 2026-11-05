import React from 'react';
import { FileText, Github, ExternalLink, BookOpen } from 'lucide-react';

export const FloatingFooter: React.FC = () => {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-neutral-300/80 bg-white/95 px-4 py-2 shadow-lg backdrop-blur-md transition-all hover:shadow-xl">
        <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-200">
          <BookOpen className="h-4 w-4 text-neutral-800" />
          <span className="text-xs font-semibold text-neutral-800 hidden sm:inline">
            Experiment Resources:
          </span>
        </div>

        <a
          href="https://www.overleaf.com/read/nxgtcjgjsdxf#7a6edc"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
        >
          <FileText className="h-3.5 w-3.5 text-blue-600" />
          <span>Overleaf Paper</span>
          <ExternalLink className="h-3 w-3 text-neutral-400" />
        </a>

        <a
          href="https://github.com/yashpola/simple-simulation-school-closure"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
        >
          <Github className="h-3.5 w-3.5 text-neutral-900" />
          <span>GitHub Code</span>
          <ExternalLink className="h-3 w-3 text-neutral-400" />
        </a>
      </div>
    </div>
  );
};

