'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import { signIn } from "next-auth/react";
import UsernameLoginForm from "@/components/UsernameLoginForm";
import RegisterForm from "@/components/RegisterForm";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import { Typewriter } from "react-simple-typewriter";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

  useEffect(() => {
    document.title = "Login or Register | Talesy - Share Your Stories with the World";
    return () => {
      document.title = "Talesy - Share Your Stories";
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setMusicPlaying(!musicPlaying);
  };

  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  const handleSuccessfulLogin = () => {
    router.push('/landing');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-[#FF9933]/70 via-white/70 to-[#138808]/70">
      <audio ref={audioRef} loop src="/music/lofi.mp3" />

      {/* Toggle Music Button */}
      <button
        onClick={toggleMusic}
        className="absolute top-4 right-4 z-30 bg-white/10 backdrop-blur-md rounded-full p-2 hover:bg-white/20 text-white text-xl"
        title="Toggle Music"
      >
        {musicPlaying ? "🔊" : "🔇"}
      </button>

      {/* Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 z-0"
        options={{
          fullScreen: false,
          background: { color: "transparent" },
          particles: {
            number: { value: 60 },
            color: { value: "#000" },
            size: { value: 2 },
            move: { enable: true, speed: 0.3 },
            opacity: { value: 0.4 },
            links: { enable: true, distance: 100, color: "#000", opacity: 0.1 },
          },
        }}
      />

      {/* Floating Typewriter */}
      <div className="absolute top-6 left-4 sm:top-10 sm:left-10 z-10 text-white text-sm sm:text-lg font-semibold drop-shadow-lg">
        <Typewriter
          words={[
            "Look who's here 👀",
            "Stories await you ✨",
            "Let's create magic 🪄",
            "Write. Share. Inspire.",
          ]}
          loop={true}
          cursor
          cursorStyle="|"
          typeSpeed={50}
          deleteSpeed={30}
          delaySpeed={1800}
        />
      </div>

      {/* Auth Box */}
      <div className="relative z-20 w-full max-w-md sm:max-w-md md:max-w-lg lg:max-w-md xl:max-w-md bg-gradient-to-br from-[#0e0e2c]/80 via-[#1a1a3a]/85 to-[#252550]/80 text-white backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold tracking-wide text-white drop-shadow-lg">Your Talesy</h1>

          <div className="flex justify-center gap-6 mt-2">
            <button
              onClick={() => setActiveTab("login")}
              className={`text-sm font-medium transition-all duration-300 ${
                activeTab === "login"
                  ? "text-white border-b-2 border-white/80"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`text-sm font-medium transition-all duration-300 ${
                activeTab === "register"
                  ? "text-white border-b-2 border-white/80"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {activeTab === "login" ? (
          <>
            <button
              onClick={() => signIn("google", { callbackUrl: '/dashboard' })}
              className="w-full bg-white/10 text-white border border-white/30 rounded-lg py-3 font-medium hover:bg-white/20 transition-all duration-300 backdrop-blur-sm text-sm"
            >
              <div className="flex items-center justify-center">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
                  alt="Google" 
                  className="w-5 h-5 mr-2" 
                />
                Sign in with Google
              </div>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px bg-white/20 flex-1"></div>
              <span className="text-sm text-white/60">OR</span>
              <div className="h-px bg-white/20 flex-1"></div>
            </div>

            <UsernameLoginForm error={loginError} />

            <div className="text-right">
              <a href="/forgot-password" className="text-xs text-gray-300 hover:text-white transition-colors duration-300 underline">
                Forgot your password?
              </a>
            </div>
          </>
        ) : (
          <>
            <RegisterForm onRegister={() => setActiveTab("login")} />
            <div className="text-right">
              <a href="/forgot-password" className="text-xs text-gray-300 hover:text-white transition-colors duration-300 underline">
                Forgot your password?
              </a>
            </div>
          </>
        )}

        <p className="text-sm text-center text-gray-300">
          {activeTab === "login" ? "Not a member yet? " : "Already have an account? "}
          <button
            onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
            className="underline hover:text-white transition-colors duration-300"
          >
            {activeTab === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
