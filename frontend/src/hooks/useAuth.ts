import useClientSideStorage from "./useClientSideStorage";

interface User {
    name: string;
    token: string;
}

export default function useAuth() {
    const [user, setUser] = useClientSideStorage<User | null>("user", null);

    const login = (name: string, token: string) => {
        setUser({ name, token });
    };

    const logout = () => {
        setUser(null);
    };

    return { user, login, logout };
}
