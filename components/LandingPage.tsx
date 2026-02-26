import React from 'react';
import { AppView } from '../types';

interface LandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--bg-tertiary)] scrollbar-track-[var(--bg-secondary)]">
            <div className="flex-grow flex flex-col items-center justify-center px-6 py-12 text-center space-y-8 animate-fade-in">
                <div className="relative">
                    <div className="text-7xl sm:text-8xl mb-4 animate-bounce-slow">🧠</div>
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-[var(--accent-primary)] rounded-full blur-xl opacity-50 animate-pulse"></div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[var(--text-primary)]">
                        Minimind <span className="text-[var(--accent-primary)]">AI</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-lg mx-auto">
                        Experience the future of digital companionship. Create, customize, and converse with unique AI personalities tailored just for you.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
                    <button
                        onClick={onGetStarted}
                        className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--button-text)] font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
                    >
                        Get Started Free
                    </button>
                    <button
                        onClick={onLogin}
                        className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold py-4 px-8 rounded-xl border border-[var(--border-color)] transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                        Sign In
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl mt-8">
                    {[
                        { icon: '✨', title: 'Smart AI', desc: 'Powered by Gemini Pro' },
                        { icon: '🎭', title: 'Custom Personas', desc: 'Endless possibilities' },
                        { icon: '🔒', title: 'Private', desc: 'Secure conversations' }
                    ].map((feature, i) => (
                        <div key={i} className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-colors duration-300">
                            <div className="text-3xl mb-2">{feature.icon}</div>
                            <h3 className="font-semibold text-[var(--text-primary)]">{feature.title}</h3>
                            <p className="text-xs text-[var(--text-tertiary)]">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
