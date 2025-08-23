'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSignIn } from '@clerk/nextjs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function AdminLoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const next = searchParams.get('next') || '/admin/dashboard'

    const { isLoaded, signIn, setActive } = useSignIn()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [remember, setRemember] = useState(true)
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!isLoaded) return
        setLoading(true)
        setError('')

        try {
            const result = await signIn.create({
                identifier: username,
                password,
            })

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId })
                router.replace(next)
            } else {
                console.log(result)
            }
        } catch (err) {
            setError(err.errors?.[0]?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Admin Login</CardTitle>
                    <CardDescription>Sign in to access admin dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Email / Username</Label>
                            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter email or username" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute inset-y-0 right-2 flex items-center"
                                >
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <Label className="font-medium">Save your login info</Label>
                                <p className="text-xs text-muted-foreground">Yes / Not now</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs">Not now</span>
                                <Switch checked={remember} onCheckedChange={setRemember} />
                                <span className="text-xs">Yes</span>
                            </div>
                        </div>
                        {error && (
                            <p className="text-sm text-red-600" role="alert">{error}</p>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            <LogIn className="mr-2 h-4 w-4" /> {loading ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground">Clerk auth with custom UI</p>
                </CardFooter>
            </Card>
        </div>
    )
}
