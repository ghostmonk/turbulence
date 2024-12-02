import React, { ReactNode } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div>
            <nav className="bg-gray-800 text-white p-4">
                <ul className="flex justify-center space-x-4">
                    <li>
                        <Link href="/">Home</Link>
                    </li>
                    <li>
                        <ThemeToggle/>
                    </li>
                </ul>
            </nav>
            <main className="p-6">{children}</main>
        </div>
    );
};

export default Layout;
