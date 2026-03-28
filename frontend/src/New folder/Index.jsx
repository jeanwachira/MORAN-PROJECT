import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ArrowRight, 
    Users, 
    Shield, 
    BarChart3, 
    Target, 
    TrendingUp, 
    FileText,
    Lock,
    Heart,
    Calendar,
    Star,
    ChevronDown,
    Menu,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import logo from '../logo/logo.png';
import moran from '../logo/moran.jpg';
import mentorship from '../logo/mentorship.jpg'

export default function Index() {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Dhahabu brand colors
    const colors = {
        primary: '#B8975A',
        dark: '#8B7355',
        light: '#D4B88C',
        black: '#000000'
    };

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
    };

    // Smooth scroll function
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offsetTop = element.offsetTop - 80; // Account for fixed nav height
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] font-sans text-stone-900">
            {/* Subtle Pattern Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23B8975A' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
                isScrolled 
                    ? 'bg-black/95 backdrop-blur-md py-3 shadow-xl' 
                    : 'bg-transparent py-6'
            }`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center"
                    >
                        <img 
                            src={logo}
                            alt="Dhahabu Themanini" 
                            className="h-12 md:h-16 w-auto brightness-110"
                        />
                    </motion.div>

                    <div className="hidden md:flex items-center space-x-8">
                        <button 
                            onClick={() => scrollToSection('vision')}
                            className={`font-medium transition-colors cursor-pointer ${isScrolled ? 'text-white/80 hover:text-[#B8975A]' : 'text-white/90 hover:text-[#B8975A]'}`}
                        >
                            Vision
                        </button>
                        <button 
                            onClick={() => scrollToSection('programs')}
                            className={`font-medium transition-colors cursor-pointer ${isScrolled ? 'text-white/80 hover:text-[#B8975A]' : 'text-white/90 hover:text-[#B8975A]'}`}
                        >
                            Programs
                        </button>
                        <button 
                            onClick={() => scrollToSection('impact')}
                            className={`font-medium transition-colors cursor-pointer ${isScrolled ? 'text-white/80 hover:text-[#B8975A]' : 'text-white/90 hover:text-[#B8975A]'}`}
                        >
                            Impact
                        </button>
                        <Button 
                            onClick={() => navigate('/login')}
                            style={{ backgroundColor: colors.primary }}
                            className="hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all"
                        >
                            Admin Portal
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <button 
                        className="md:hidden p-2 text-white" 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40 z-10" />
                    <img 
                        src={moran}
                        alt="Moran Community" 
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-20 w-full">
                    <div className="max-w-4xl">
                        <motion.div 
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-8 border-2 shadow-lg"
                            style={{ 
                                backgroundColor: `${colors.primary}20`,
                                borderColor: colors.primary,
                                color: colors.primary
                            }}
                        >
                            <Star className="h-4 w-4 fill-current" />
                            <span>Cultural Heritage • Modern Excellence</span>
                        </motion.div>

                        <motion.h1 
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8"
                        >
                            Dhahabu <br />
                            <span 
                                className="text-transparent bg-clip-text bg-gradient-to-r"
                                style={{ 
                                    backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.light}, ${colors.primary})`
                                }}
                            >
                                Themanini
                            </span>
                        </motion.h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed font-medium max-w-3xl"
                        >
                            Comprehensive Database Management Platform for the Moran Project. 
                            Honoring tradition through precision data and transformative community impact.
                        </motion.p>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <Button 
                                size="lg" 
                                onClick={() => navigate('/login')}
                                className="px-8 py-6 text-lg font-bold text-white shadow-2xl hover:shadow-3xl transition-all"
                                style={{ backgroundColor: colors.primary }}
                            >
                                Launch Dashboard
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </motion.div>
                    </div>
                </div>

                <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 hidden md:block"
                >
                    <ChevronDown className="h-8 w-8" style={{ color: colors.primary }} />
                </motion.div>
            </section>

            {/* System Objectives */}
            <section id="vision" className="py-32 px-6 lg:px-12 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <motion.span 
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="font-bold tracking-[0.3em] uppercase text-sm"
                            style={{ color: colors.primary }}
                        >
                            Our Foundation
                        </motion.span>
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-6xl font-black mt-4 text-stone-900"
                        >
                            System <span style={{ color: colors.primary }}>Objectives</span>
                        </motion.h2>
                        <p className="text-xl text-stone-600 mt-6 max-w-3xl mx-auto font-medium">
                            Built to honor our heritage while driving excellence in program management
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            {
                                icon: Target,
                                title: "Centralized Data Management",
                                desc: "Unified platform safeguarding family profiles, contact information, participation history, and progress tracking across all programs and cohorts."
                            },
                            {
                                icon: TrendingUp,
                                title: "Growth & Outcome Tracking",
                                desc: "Monitor development milestones and measure transformative impact across Ithemba, Junior Moran, Cut-to-ID, and Alumni programs."
                            },
                            {
                                icon: BarChart3,
                                title: "Data-Driven Insights",
                                desc: "Advanced analytics powering personalized mentoring approaches, identifying emerging patterns, and enhancing program effectiveness."
                            },
                            {
                                icon: FileText,
                                title: "Comprehensive Reporting",
                                desc: "Generate detailed insights for internal review, community engagement, fundraising initiatives, and thorough program evaluation."
                            }
                        ].map((obj, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="relative p-10 bg-stone-50/50 rounded-3xl border-2 border-stone-200 hover:border-[#B8975A] hover:shadow-2xl transition-all duration-500 group"
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <div 
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: colors.primary }}
                                    >
                                        <obj.icon className="h-8 w-8 text-white" />
                                    </div>
                                    <span className="text-stone-200 font-black text-4xl">0{i+1}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-stone-900 mb-4">{obj.title}</h3>
                                <p className="text-stone-600 leading-relaxed text-lg">{obj.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Program Ecosystem */}
            <section id="programs" className="py-32 px-6 lg:px-12 bg-black text-white relative overflow-hidden">
                <div 
                    className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[160px] opacity-20 -translate-y-1/2 translate-x-1/2"
                    style={{ backgroundColor: colors.primary }}
                />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-24">
                        <motion.span 
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="font-bold tracking-[0.3em] uppercase text-sm"
                            style={{ color: colors.primary }}
                        >
                            The Journey
                        </motion.span>
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-6xl font-black mt-4"
                        >
                            Program Ecosystem
                        </motion.h2>
                        <p className="text-xl text-white/70 mt-6 max-w-3xl mx-auto">
                            Guiding the journey from initiation through lifelong engagement
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Ithemba", icon: Heart, label: "Foundation Program" },
                            { title: "Junior Moran", icon: Users, label: "Leadership Development" },
                            { title: "Cut-to-ID", icon: Shield, label: "Identity Formation" },
                            { title: "Alumni", icon: Star, label: "Continued Mentorship" }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -10 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="group relative bg-white/5 border-2 border-white/10 hover:border-[#B8975A] p-8 rounded-3xl backdrop-blur-sm flex flex-col items-center text-center transition-all duration-500"
                            >
                                <div 
                                    className="mb-6 p-5 rounded-full group-hover:scale-110 transition-transform"
                                    style={{ 
                                        backgroundColor: `${colors.primary}30`,
                                        color: colors.primary
                                    }}
                                >
                                    <item.icon className="h-10 w-10" />
                                </div>
                                <h4 className="text-2xl font-bold mb-2 uppercase tracking-wide">{item.title}</h4>
                                <span className="text-white/60 font-medium tracking-widest text-xs uppercase">{item.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section id="impact" className="py-32 px-6 lg:px-12 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
                    <div className="lg:w-1/2">
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1 }}
                            className="relative"
                        >
                            <div 
                                className="absolute -inset-4 rounded-[3rem] -rotate-3 z-0"
                                style={{ backgroundColor: `${colors.light}40` }}
                            />
                            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
                                <img 
                                    src={mentorship}
                                    alt="Moran Community Impact"
                                    className="w-full h-[600px] object-cover"
                                />
                            </div>
                        </motion.div>
                    </div>

                    <div className="lg:w-1/2">
                        <h2 className="text-5xl font-black text-stone-900 mb-12 leading-tight">
                            Measurable Impact, <br />
                            <span style={{ color: colors.primary }}>Enduring Legacy.</span>
                        </h2>
                        
                        <div className="space-y-10">
                            {[
                                { 
                                    title: "Participant Management", 
                                    desc: "Track mentees, families, and mentors across all program stages with comprehensive profiles.", 
                                    icon: Users 
                                },
                                { 
                                    title: "Event Coordination", 
                                    desc: "Schedule and manage ceremonies, workshops, and cultural activities seamlessly.", 
                                    icon: Calendar 
                                },
                                { 
                                    title: "Progress Analytics", 
                                    desc: "Monitor growth metrics and program effectiveness in real-time with powerful insights.", 
                                    icon: BarChart3 
                                }
                            ].map((feat, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.2 }}
                                    viewport={{ once: true }}
                                    className="flex gap-6"
                                >
                                    <div 
                                        className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-xl"
                                        style={{ backgroundColor: colors.primary }}
                                    >
                                        <feat.icon className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-stone-900 mb-2">{feat.title}</h4>
                                        <p className="text-stone-600 leading-relaxed text-lg">{feat.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-12 p-8 bg-stone-50 rounded-2xl border-2" style={{ borderColor: `${colors.primary}40` }}>
                            <div className="flex items-center gap-4 mb-4">
                                <Lock className="h-6 w-6" style={{ color: colors.primary }} />
                                <h4 className="text-xl font-bold text-stone-900">Enterprise Security</h4>
                            </div>
                            <p className="text-stone-600 leading-relaxed">
                                Protected administrative access ensuring data integrity and confidentiality 
                                for all participant information and sacred program data.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 lg:px-12 relative overflow-hidden" style={{ backgroundColor: colors.primary }}>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
                        Ready to Transform Program Management?
                    </h2>
                    <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
                        Access the centralized platform to drive data-informed decisions and maximize impact across all Moran initiatives.
                    </p>
                    <Button 
                        onClick={() => navigate('/login')}
                        size="lg"
                        className="bg-black text-white hover:bg-stone-900 px-12 py-7 text-xl font-bold shadow-2xl transition-all"
                    >
                        Launch Admin Dashboard
                        <ArrowRight className="ml-3 h-6 w-6" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black pt-24 pb-12 px-6 lg:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-16">
                        <div>
                            <img 
                                src={logo}
                                alt="Dhahabu Themanini" 
                                className="h-20 w-auto mb-6 brightness-110"
                            />
                            <p className="text-white/70 font-medium max-w-md text-lg leading-relaxed">
                                Elevating the Moran journey through sophisticated data intelligence and cultural reverence.
                            </p>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-4">
                            <p 
                                className="font-bold text-lg tracking-widest uppercase"
                                style={{ color: colors.primary }}
                            >
                                Honoring Heritage • Driving Excellence • Always
                            </p>
                        </div>
                    </div>
                    
                    <div className="h-px bg-white/10 w-full mb-8" />
                    
                    <div className="flex flex-col md:flex-row justify-between text-white/60 text-sm">
                        <p>© {new Date().getFullYear()} Dhahabu Themanini Family Centre. All rights reserved.</p>
                        <div className="flex gap-8 mt-4 md:mt-0">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}