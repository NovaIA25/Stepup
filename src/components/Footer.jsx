import React from 'react';
import { Zap, Heart, Github, Twitter } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <a href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">
                                Step<span className="text-green-400">Up</span>
                            </span>
                        </a>
                        <p className="text-gray-400 max-w-sm">
                            L'outil de suppression de fond vert le plus simple et le plus efficace.
                            100% gratuit, sans inscription, directement dans votre navigateur.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Liens utiles</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#features" className="text-gray-400 hover:text-green-400 transition-colors">
                                    Fonctionnalités
                                </a>
                            </li>
                            <li>
                                <a href="#how-it-works" className="text-gray-400 hover:text-green-400 transition-colors">
                                    Comment ça marche
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Légal</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                                    Confidentialité
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                                    Conditions d'utilisation
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                        © {currentYear} StepUp. Fait avec <Heart className="w-4 h-4 text-red-500" /> en France
                    </p>

                    <div className="flex items-center gap-4">
                        <a href="#" className="text-gray-500 hover:text-white transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-500 hover:text-white transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
