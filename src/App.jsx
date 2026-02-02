import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import GreenScreenRemover from './components/GreenScreenRemover';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';

function App() {
    const [showTool, setShowTool] = useState(false);

    return (
        <div className="min-h-screen bg-slate-900">
            <Header onStartClick={() => setShowTool(true)} />

            {!showTool ? (
                <>
                    <Hero onStartClick={() => setShowTool(true)} />
                    <Features />
                    <HowItWorks />
                </>
            ) : (
                <main className="pt-20">
                    <GreenScreenRemover />
                </main>
            )}

            <Footer />
        </div>
    );
}

export default App;
