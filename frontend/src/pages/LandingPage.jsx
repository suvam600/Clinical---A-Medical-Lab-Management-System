// src/pages/LandingPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Users,
  MessageSquare,
  FileText,
  Activity,
  CheckCircle,
  Star,
  Menu,
  X,
  Sparkles,
  Stethoscope,
} from "lucide-react";

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Users,
      title: "Patient Registration",
      description:
        "Quick and secure registration with citizenship ID and verified email access.",
      color: "from-blue-500 to-blue-600",
      bg: "from-blue-50 to-blue-100",
      stats: "Easy onboarding",
    },
    {
      icon: Activity,
      title: "Test Management",
      description:
        "Manage lab tests, track requests, and update workflow efficiently in real time.",
      color: "from-green-500 to-emerald-600",
      bg: "from-green-50 to-emerald-100",
      stats: "Real-time updates",
    },
    {
      icon: FileText,
      title: "Digital Reports",
      description:
        "Patients can view and download reports online without waiting for manual delivery.",
      color: "from-purple-500 to-pink-600",
      bg: "from-purple-50 to-pink-100",
      stats: "Instant access",
    },
    {
      icon: MessageSquare,
      title: "Consultation Chat",
      description:
        "Secure doctor-patient messaging with text, image, and PDF sharing in one place.",
      color: "from-orange-500 to-red-500",
      bg: "from-orange-50 to-red-100",
      stats: "Better communication",
    },
  ];

  const testimonials = [
    {
      name: "Dr.Arjun Dhakal",
      role: "Chief Medical Officer",
      content:
        "Clinical makes consultation handling and report access much faster for both staff and patients.",
      rating: 5,
    },
    {
      name: "Adarsh Sapkota",
      role: "Patient",
      content:
        "I can register, check reports, and communicate with the doctor from one system. It feels simple and smooth.",
      rating: 5,
    },
    {
      name: "Dr.Anjal Basnet",
      role: "Lab Director",
      content:
        "The system improves coordination between departments and reduces delays in patient communication.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md"
            : "bg-white/80 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-lg font-bold text-white shadow-md">
              C
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900">Clinical</h1>
              <p className="text-xs text-slate-500">
                Medical Lab Management System
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              Testimonials
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              About
            </a>
            
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:text-blue-600 sm:block"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:shadow-lg"
            >
              Sign up
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="rounded-lg p-2 transition hover:bg-slate-100 md:hidden"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white shadow-md md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6">
              <a
                href="#features"
                className="text-sm text-slate-600 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="text-sm text-slate-600 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <a
                href="#about"
                className="text-sm text-slate-600 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </a>
            
              <Link
                to="/login"
                className="text-sm text-slate-600 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 opacity-40">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.10),_transparent_30%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium text-blue-700">
                Secure and modern digital healthcare workflow
              </span>
            </div>

            <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Better lab services with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Clinical
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 lg:mx-0">
              A complete medical lab management platform for patients, doctors,
              technicians, and administrators to manage tests, reports,
              consultations, and communication in one secure system.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
              >
                Get started
                <ArrowRight size={18} />
              </Link>

              

              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-bold text-blue-600">50K+</p>
                <p className="text-sm text-slate-500">Patients</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">100K+</p>
                <p className="text-sm text-slate-500">Test managed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">100K+</p>
                <p className="text-sm text-slate-500">Tests done</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/80">
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
                    <Users size={20} className="text-white" />
                  </div>
                  <p className="font-semibold text-slate-900">Patient Portal</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Registration, reports, bookings
                  </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-500">
                    <Activity size={20} className="text-white" />
                  </div>
                  <p className="font-semibold text-slate-900">Doctor Access</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Consultation review and follow-up
                  </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500">
                    <FileText size={20} className="text-white" />
                  </div>
                  <p className="font-semibold text-slate-900">Reports</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Digital PDF access anytime
                  </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500">
                    <MessageSquare size={20} className="text-white" />
                  </div>
                  <p className="font-semibold text-slate-900">Consultation</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Secure doctor-patient chat
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
                <p className="mb-3 text-sm font-semibold">
                  Why choose Clinical?
                </p>
                <ul className="space-y-2 text-sm text-blue-50">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} />
                    Centralized management of lab workflow
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} />
                    Role-based access for all users
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} />
                    Email verification and secure login
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5">
              <Sparkles size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Core features
              </span>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything in one platform
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Streamline lab operations and patient communication with a clean,
              secure, and role-based system.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-2xl bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${feature.color} transition group-hover:scale-110`}
                >
                  <feature.icon size={22} className="text-white" />
                </div>

                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mb-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
                <p className="text-xs font-semibold text-blue-600">
                  {feature.stats}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5">
              <Star size={16} className="fill-blue-600 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Testimonials
              </span>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Trusted by healthcare users
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-2xl bg-slate-50 p-6 transition hover:shadow-lg"
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <p className="mb-6 text-sm leading-7 text-slate-600">
                  “{testimonial.content}”
                </p>

                <div>
                  <p className="font-semibold text-slate-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to improve your digital lab workflow?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            Join patients and healthcare staff using Clinical to manage tests,
            reports, and consultations more efficiently.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3 text-sm font-semibold text-blue-700 transition hover:scale-[1.02] hover:shadow-xl"
            >
              Create account
              <ArrowRight size={18} />
            </Link>

           

            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-white px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-bold">
                  C
                </div>
                <p className="font-semibold">Clinical</p>
              </div>
              <p className="text-sm leading-6 text-slate-400">
                Modern medical lab management system for organized and
                patient-friendly healthcare service delivery.
              </p>
            </div>

            <div>
              <h4 className="mb-3 font-semibold">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#features" className="transition hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="transition hover:text-white">
                    Testimonials
                  </a>
                </li>
                <li>
                  <a href="#about" className="transition hover:text-white">
                    About
                  </a>
                </li>
                <li>
                 
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 font-semibold">Access</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link to="/login" className="transition hover:text-white">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="transition hover:text-white">
                    Sign up
                  </Link>
                </li>
                <li>
                  
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 font-semibold">Security</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Email verification</li>
                <li>Role-based access</li>
                <li>Secure patient communication</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>© {new Date().getFullYear()} Clinical. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;