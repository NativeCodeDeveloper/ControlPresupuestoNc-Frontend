import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#010207] text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(59,130,246,0.26),transparent_42%),radial-gradient(circle_at_78%_16%,rgba(79,70,229,0.18),transparent_36%),radial-gradient(circle_at_50%_86%,rgba(14,165,233,0.13),transparent_43%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.07),transparent_20%,transparent_72%,rgba(255,255,255,0.05))]" />

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:py-12">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/ico2.png" alt="NativeCode" className="h-8 w-8 object-contain" />
                        <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/75">NATIVECODE</p>
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100/65">Finance Platform</p>
                </header>

                <section className="my-auto w-full text-center">
                    <div className="mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/18 bg-black/50 shadow-[0_0_70px_rgba(37,99,235,0.35)] backdrop-blur-md sm:h-24 sm:w-24">
                        <img
                            src="/ico2.png"
                            alt="NativeCode"
                            className="h-14 w-14 object-contain drop-shadow-[0_0_14px_rgba(255,255,255,0.2)] sm:h-16 sm:w-16"
                        />
                    </div>

                    <h1
                        className="text-[2.2rem] font-semibold uppercase leading-[1.03] tracking-[0.06em] text-white sm:text-[4rem] md:text-[5.3rem]"
                        style={{ fontFamily: '"SF Pro Display", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                    >
                        NATIVECODE
                        <span className="block bg-gradient-to-r from-blue-100 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                            FINANCE
                        </span>
                    </h1>

                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.36em] text-blue-100/72 sm:text-xs mt-6 sm:mt-8">
                        by NATIVECODE
                    </p>

                    <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-[1.02rem]">
                        Plataforma de control financiero para decisiones ejecutivas, visibilidad total de fondos y experiencia de alto nivel.
                    </p>

                    <div className="mt-11">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 rounded-full border border-blue-200/35 bg-gradient-to-r from-blue-500/80 via-blue-600/80 to-indigo-600/80 px-8 py-3 text-sm font-semibold tracking-wide text-white shadow-[0_14px_34px_rgba(37,99,235,0.38)] transition-all duration-300 hover:scale-[1.015] hover:from-blue-400 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/80"
                        >
                            Entrar al Dashboard
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

                <footer className="pt-10 text-center text-[11px] uppercase tracking-[0.18em] text-white/45">
                    Premium Financial Control Experience
                </footer>
            </div>
        </div>
    );
}
