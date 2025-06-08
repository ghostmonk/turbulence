import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import StoryProgressBar from "./StoryProgressBar";
import { useFetchStories } from "@/hooks/useStories";

export default function TopNav() {
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { stories, totalStories } = useFetchStories();

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <nav className="nav">
            <div className="nav__container">
                <div className="flex space-x-4">
                    {/* Desktop Navigation */}
                    <div className="nav__links">
                        <Link href="/" className="nav__link">
                            Home
                        </Link>
                        {session && (
                            <Link href="/editor" className="nav__link">
                                New Story
                            </Link>
                        )}
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <button 
                        className="nav__mobile-toggle"
                        onClick={toggleMobileMenu}
                        aria-label="Toggle mobile menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                </div>
                
                <div className="flex items-center space-x-4">
                    {session ? (
                        <div className="flex items-center space-x-4">
                            <span className="hidden md:inline text-text-primary">Welcome, {session.user?.name || "User"}!</span>
                            <button
                                onClick={() => signOut()}
                                className="btn btn--secondary"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn("google")}
                            className="btn btn--primary"
                        >
                            Sign in
                        </button>
                    )}
                    <ThemeToggle />
                </div>
            </div>
            
            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="nav__mobile-menu">
                    <div className="nav__mobile-links">
                        <Link 
                            href="/" 
                            className="nav__mobile-link"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Home
                        </Link>
                        {session && (
                            <Link 
                                href="/editor" 
                                className="nav__mobile-link"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                New Story
                            </Link>
                        )}
                    </div>
                </div>
            )}
            
            {/* Integrated Progress Bar */}
            {stories.length > 0 && (
                <StoryProgressBar 
                    currentStoryCount={stories.length}
                    totalStoryCount={totalStories}
                />
            )}
        </nav>
    );
}
