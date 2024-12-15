import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useSession, signIn, signOut } from "next-auth/react";

export default function TopNav() {
    const { data: session } = useSession();

    return (
        <nav className="bg-gray-800 text-white p-4">
            {/* Flex container for the entire navigation */}
            <div className="flex justify-between items-center">
                {/* Left: Navigation Links */}
                <div className="flex space-x-4">
                    <Link href="/" className="hover:underline">
                        Home
                    </Link>
                    {session && (
                        <Link href="/edit" className="hover:underline">
                            Add Post
                        </Link>
                    )}
                </div>

                {/* Right: Theme Toggle and Login/Logout */}
                <div className="flex items-center space-x-4">
                    {session ? (
                        <div className="flex items-center space-x-4">
                            <span>Welcome, {session.user?.name || "User"}!</span>
                            <button
                                onClick={() => signOut()}
                                className="px-3 py-1 bg-gray-700 text-white hover:bg-gray-600 rounded transition duration-200"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn("google")}
                            className="px-3 py-1 bg-gray-700 text-white hover:bg-gray-600 rounded transition duration-200"
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
