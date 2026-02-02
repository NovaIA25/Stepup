import React from 'react';
import { Zap } from 'lucide-react';

export default function Header({ onStartClick }) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg group-hover:shadow-green-500/50 transition-shadow">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">
                            Step<span className="text-green-400">Up</span>
                        </span>
                    </a>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                            Fonctionnalités
                        </a>
                        <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                            Comment ça marche
                        </a>
                    </nav>

                    {/* CTA Button */}
                    <button
                        onClick={onStartClick}
                        className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-full hover:from-green-400 hover:to-green-500 transition-all shadow-lg hover:shadow-green-500/50 btn-hover-lift"
                    >
                        Commencer
                    </button>
                </div>
            </div>
        </header>
    );
}
