import React, { createContext, useContext, useState, useEffect } from 'react';

// 🔐 Create Auth Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (err) {
                console.error("Failed to parse user from localStorage", err);
                localStorage.removeItem('user');
            }
        }
    }, []);

    const register = async (name, email, password, role = 'customer') => {
        const cleanEmail = email.trim().toLowerCase();
        const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');

        const userExists = existingUsers.some(u => u.email.toLowerCase() === cleanEmail);
        if (userExists) {
            return { success: false, error: '❌ Email is already registered. Please login!' };
        }

        const newUser = {
            id: `CUST-${Date.now()}`,
            name: name.trim(),
            email: cleanEmail,
            password: password,
            role: role.toLowerCase(),
        };

        existingUsers.push(newUser);
        localStorage.setItem('registered_users', JSON.stringify(existingUsers));

        return { success: true, message: '✅ Registration successful! Please login.' };
    };

    const login = async (email, password, selectedRole) => {
        const cleanEmail = email.trim().toLowerCase();
        const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');

        let foundUser = existingUsers.find(
            (u) => u.email.toLowerCase() === cleanEmail && u.password === password
        );

        // Dev Hardcoded Testing Credentials
        if (!foundUser) {
            if (cleanEmail === 'admin@gmail.com' && password === '123456') {
                foundUser = { id: 'ADM-1', name: 'System Admin', email: 'admin@gmail.com', role: 'admin' };
            } else if (cleanEmail === 'agent@gmail.com' && password === '123456') {
                foundUser = { id: 'AGT-1', name: 'Insurance Agent', email: 'agent@gmail.com', role: 'agent' };
            } else if (cleanEmail === 'vishal@gmail.com' && password === '123456') {
                foundUser = { id: 'CUST-1', name: 'Vishal', email: 'vishal@gmail.com', role: 'customer' };
            }
        }

        if (!foundUser) {
            return { success: false, error: '❌ Invalid Email or Password!' };
        }

        if (selectedRole && foundUser.role.toLowerCase() !== selectedRole.toLowerCase()) {
            return { 
                success: false, 
                error: `❌ Access Denied! Your email belongs to a "${foundUser.role.toUpperCase()}" account.` 
            };
        }

        const userData = {
            id: foundUser.id || `USR-${Date.now()}`,
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role,
        };

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', 'dummy-auth-token-' + Date.now());
        setUser(userData);
        return { success: true, user: userData };
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// 🌟 Custom Hook for consumption across components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};