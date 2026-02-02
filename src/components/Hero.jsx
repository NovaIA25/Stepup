import React from 'react';
import { ArrowRight, Sparkles, Play } from 'lucide-react';

export default function Hero({ onStartClick }) {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden animated-bg">
            {/* Decorative elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl float-animation"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl float-animation-delayed"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"></div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-40"></div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-200">100% Gratuit • Sans inscription</span>
                </div>

                {/* Main heading */}
                <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
                    Supprimez vos
                    <span className="block gradient-text">fonds verts</span>
                    en un clic
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Outil professionnel de <strong className="text-green-400">chroma key</strong> directement dans votre navigateur.
                    Transformez vos vidéos et images instantanément.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={onStartClick}
                        className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-2xl hover:from-green-400 hover:to-emerald-500 transition-all shadow-2xl shadow-green-500/30 btn-hover-lift"
                    >
                        <span>Commencer maintenant</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <a
                        href="#how-it-works"
                        className="flex items-center gap-3 px-8 py-4 text-white font-semibold text-lg rounded-2xl border-2 border-white/20 hover:border-white/40 hover:bg-white/5 transition-all"
                    >
                        <Play className="w-5 h-5" />
                        <span>Voir comment ça marche</span>
                    </a>
                </div>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white">100%</div>
                        <div className="text-sm text-gray-400 mt-1">Gratuit</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white">0</div>
                        <div className="text-sm text-gray-400 mt-1">Inscription</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white">∞</div>
                        <div className="text-sm text-gray-400 mt-1">Fichiers</div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
                    <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce"></div>
                </div>
            </div>
        </section>
    );
}
