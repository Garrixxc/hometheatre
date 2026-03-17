import React from 'react';
import { Play } from 'lucide-react';
import { signInWithGoogle } from '../../firebase';

export const LoginView = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
    <div className="w-20 h-20 bg-[#0A84FF] rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-[#0A84FF]/20">
      <Play className="w-10 h-10 text-white fill-white" />
    </div>
    <h1 className="text-4xl font-bold mb-4 tracking-tight text-foreground">HomeTheatre</h1>
    <p className="text-gray-500 mb-12 max-w-xs">Watch movies and shows together with friends in real-time.</p>
    <button 
      onClick={signInWithGoogle}
      className="w-full bg-foreground text-background py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pjax/google.png" className="w-5 h-5" alt="Google" />
      Sign in with Google
    </button>
  </div>
);
