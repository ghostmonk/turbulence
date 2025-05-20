import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function TopNav() {
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <nav className="dark:bg-gray-900 bg-gray-100 dark:text-white text-gray-800 p-4 shadow-md transition-colors duration-300">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex space-x-4">
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex space-x-4 items-center">
                        <Link href="/" className="hover:text-blue-500 transition-colors">
                            Home
                        </Link>
                        {session && (
                            <Link href="/editor" className="hover:text-blue-500 transition-colors">
                                New Story
                            </Link>
                        )}
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <button 
                        className="md:hidden flex items-center text-gray-600 dark:text-gray-200"
                        onClick={toggleMobileMenu}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                </div>
                <div className="flex items-center space-x-4">
                    {session ? (
                        <div className="flex items-center space-x-4">
                            <span className="hidden md:inline">Welcome, {session.user?.name || "User"}!</span>
                            <button
                                onClick={() => signOut()}
                                className="px-3 py-1 dark:bg-gray-800 bg-gray-200 dark:text-white text-gray-800 dark:hover:bg-gray-700 hover:bg-gray-300 rounded transition duration-200"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn("google")}
                            className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded transition duration-200"
                        >
                            Sign in
                        </button>
                    )}
                    <ThemeToggle />
                </div>
            </div>
            
            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden mt-2 pt-2 border-t dark:border-gray-700 border-gray-200">
                    <div className="flex flex-col space-y-2 px-2">
                        <Link 
                            href="/" 
                            className="hover:text-blue-500 transition-colors py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Home
                        </Link>
                        {session && (
                            <Link 
                                href="/editor" 
                                className="hover:text-blue-500 transition-colors py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                New Story
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
