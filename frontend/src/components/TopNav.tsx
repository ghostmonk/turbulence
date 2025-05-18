import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useSession, signIn, signOut } from "next-auth/react";

export default function TopNav() {
    const { data: session } = useSession();

    return (
        <nav className="bg-gray-800 dark:bg-gray-900 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex space-x-4">
                    <div className="hidden md:flex space-x-4 items-center">
                        <Link href="/" className="hover:text-blue-300 transition-colors">
                            Home
                        </Link>
                        {session && (
                            <Link href="/editor" className="hover:text-blue-300 transition-colors">
                                New Post
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
                                className="px-3 py-1 bg-gray-700 dark:bg-gray-800 text-white hover:bg-gray-600 dark:hover:bg-gray-700 rounded transition duration-200"
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
