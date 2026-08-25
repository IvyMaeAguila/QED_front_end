import { createContext, useContext, useState } from 'react'
import type { GradeLevel } from "../features/profiles/admin/pages/studentrecords/types/Students"

type Role = 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'PARENT'

type User = {
    id: string
    email?: string
    role: Role
    name?: string
    gradeLevel?: GradeLevel   // only present when role === 'TEACHER'
    section?: string
}


type AuthContextType = {
    user: User | null
    isLoading: boolean
    login: (user: User, token: string) => void
    logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }){
    const [user, setUser] = useState< User | null >(null)
    const [isLoading, setIsloading] = useState(false)

    function login(user: User, token: string){
        localStorage.setItem('token', token)
        setUser(user)
    }

    function logout(){
        localStorage.removeItem('token')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){
    const ctx = useContext(AuthContext)
    if(!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}