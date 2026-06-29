import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#010207] flex items-center justify-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(59,130,246,0.26),transparent_42%),radial-gradient(circle_at_78%_16%,rgba(79,70,229,0.18),transparent_36%)]" />
            <SignIn />
        </div>
    );
}
