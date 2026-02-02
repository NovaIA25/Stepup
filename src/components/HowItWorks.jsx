import React from 'react';
import { Upload, Sliders, Download, Check } from 'lucide-react';

const steps = [
    {
        number: 1,
        icon: Upload,
        title: 'Chargez votre fichier',
        description: 'Glissez-déposez ou cliquez pour sélectionner une image ou vidéo avec fond vert.',
    },
    {
        number: 2,
        icon: Sliders,
        title: 'Ajustez les paramètres',
        description: 'Utilisez les curseurs pour affiner la détection du vert et le lissage des bords.',
    },
    {
        number: 3,
        icon: Download,
        title: 'Téléchargez le résultat',
        description: 'Exportez votre image avec un fond transparent en haute qualité.',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-slate-900 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2"></div>
            <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Simple comme <span className="gradient-text">1, 2, 3</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Pas besoin d'être un expert. Notre outil est conçu pour être intuitif.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <div key={index} className="relative">
                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-14 left-1/2 w-full h-0.5 bg-gradient-to-r from-green-500/50 to-transparent"></div>
                            )}

                            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center hover:border-green-500/50 transition-colors group">
                                {/* Step number badge */}
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-green-500/30">
                                    {step.number}
                                </div>

                                {/* Icon */}
                                <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-700/50 flex items-center justify-center mb-6 group-hover:bg-green-500/10 transition-colors">
                                    <step.icon className="w-10 h-10 text-green-400" />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-gray-400">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Result showcase */}
                <div className="mt-20 text-center">
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/30">
                        <Check className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-medium">Et voilà ! Votre image est prête en quelques secondes</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
