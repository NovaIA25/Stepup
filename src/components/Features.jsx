import React from 'react';
import { Image, Video, Wand2, Download, Shield, Zap } from 'lucide-react';

const features = [
    {
        icon: Image,
        title: 'Images & Vidéos',
        description: 'Supportez tous les formats populaires : PNG, JPG, MP4, WEBM et plus.',
        color: 'from-pink-500 to-rose-500',
    },
    {
        icon: Wand2,
        title: 'Détection Intelligente',
        description: 'Notre algorithme détecte automatiquement toutes les nuances de vert.',
        color: 'from-purple-500 to-violet-500',
    },
    {
        icon: Zap,
        title: 'Traitement Instantané',
        description: 'Tout se passe dans votre navigateur. Aucun upload, aucune attente.',
        color: 'from-yellow-500 to-orange-500',
    },
    {
        icon: Download,
        title: 'Export PNG Transparent',
        description: 'Téléchargez vos résultats en PNG haute qualité avec transparence.',
        color: 'from-green-500 to-emerald-500',
    },
    {
        icon: Shield,
        title: '100% Privé',
        description: 'Vos fichiers ne quittent jamais votre appareil. Confidentialité totale.',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Video,
        title: 'Prévisualisation Live',
        description: 'Visualisez les changements en temps réel pendant l\'ajustement.',
        color: 'from-indigo-500 to-purple-500',
    },
];

export default function Features() {
    return (
        <section id="features" className="py-24 bg-slate-800/50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Fonctionnalités <span className="gradient-text">puissantes</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Tout ce dont vous avez besoin pour supprimer vos fonds verts comme un pro
                    </p>
                </div>

                {/* Features grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-6 rounded-2xl bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 transition-all hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
