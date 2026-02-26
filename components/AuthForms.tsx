import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface AuthFormsProps {
    type: 'login' | 'signup';
    onSwitch: () => void;
    onSuccess: (userData: any) => void;
    onBack: () => void;
}

const AuthForms: React.FC<AuthFormsProps> = ({ type, onSwitch, onSuccess, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let result;
            if (type === 'signup') {
                result = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                });
            } else {
                result = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
            }

            if (result.error) throw result.error;

            if (result.data.user) {
                onSuccess(result.data);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)] p-6 sm:p-10">
            <button onClick={onBack} className="self-start text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-8 transition-colors">
                <i className="fas fa-arrow-left mr-2"></i> Back
            </button>

            <div className="max-w-md w-full mx-auto space-y-8 animate-slide-up">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">
                        {type === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="mt-2 text-[var(--text-tertiary)]">
                        {type === 'login' ? "Elevate your AI experience" : "Join the future of conversation"}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="rounded-md shadow-sm space-y-4">
                        {type === 'signup' && (
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg py-3 px-4 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg py-3 px-4 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg py-3 px-4 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-[var(--button-text)] bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)] transition-all disabled:opacity-50"
                    >
                        {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : (type === 'login' ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        onClick={onSwitch}
                        className="text-sm text-[var(--accent-primary)] hover:underline font-medium"
                    >
                        {type === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthForms;
