import { useState } from 'react'
import { supabase } from '../supabase'

export default function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSignup = async (e) => {
        e.preventDefault()
        const { user, error } = await supabase.auth.signUp({ email, password })
        if (error) console.error(error)
        else console.log(user)
    }

    return (
        <form onSubmit={handleSignup}>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            <button type="submit">Sign up</button>
        </form>
    )
}
