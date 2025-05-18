import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useSession, signIn, signOut } from "next-auth/react";

export default function TopNav() {
    const { data: session } = useSession();

    return (
        <nav className="dark:bg-gray-900 bg-gray-100 dark:text-white text-gray-800 p-4 shadow-md transition-colors duration-300">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex space-x-4">
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
        </nav>
    );
}
