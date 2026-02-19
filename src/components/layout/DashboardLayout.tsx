import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-neon-cyan/30">
            <Sidebar />
            <Navbar />
            <main className="pl-64 pt-20 min-h-screen">
                <div className="container mx-auto p-8 animate-fade-in">
                    {children}
                </div>
            </main>

            {/* Background Ambient Glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-neon-violet/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[120px]" />
            </div>
        </div>
    );
}
