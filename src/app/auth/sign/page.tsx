"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { generateCSRFToken } from "@/lib/utils";

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  general?: string;
}

export default function SignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => {
    const cb = searchParams.get("callbackUrl");
    try {
      if (cb) {
        const u = new URL(cb, typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");
        if (typeof window !== "undefined") {
          if (u.origin === window.location.origin) return u.toString();
          return window.location.origin + "/";
        }
        return u.toString();
      }
    } catch {}
    return "/";
  }, [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [csrfToken, setCsrfToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    console.log('🔍 SIGNUP PAGE: Session status:', status, 'Session:', session);
    console.log('🔍 SIGNUP PAGE: Callback URL:', callbackUrl);
    if (status === 'authenticated' && session) {
      console.log('🚫 SIGNUP PAGE: Authenticated user detected, redirecting to:', callbackUrl);
      
      // Add a small delay to ensure session is fully established
      const redirectTimer = setTimeout(() => {
        if (callbackUrl && callbackUrl !== '/' && !callbackUrl.startsWith('/auth/')) {
          router.push(callbackUrl);
        } else {
          router.push('/');
        }
      }, 500); // Small delay to ensure session stability
      
      return () => clearTimeout(redirectTimer);
    }
  }, [status, session, callbackUrl, router]);

  // Generate CSRF token on component mount
  useEffect(() => {
    const token = generateCSRFToken();
    setCsrfToken(token);
    // Store token in sessionStorage for verification
    sessionStorage.setItem("csrfToken", token);
  }, []);

  const validateForm = () => {
    const newErrors: ValidationErrors = {};

    if (name && name.length > 50) {
      newErrors.name = "Name must be 50 characters or less";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email format is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (password !== confirm) {
      newErrors.confirm = "Passwords do not match";
    }

    return newErrors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        // automatically sign in after registration
        const signInResult = await signIn("credentials", { 
          email, 
          password, 
          csrfToken, 
          callbackUrl,
          redirect: false 
        });
        
        if (signInResult?.error) {
          setErrors({ general: "Registration successful but sign in failed. Please try logging in." });
        } else if (signInResult?.url) {
          router.push(signInResult.url);
        } else {
          // Wait for session to be established, then redirect
          setTimeout(() => {
            if (callbackUrl && callbackUrl !== '/' && !callbackUrl.startsWith('/auth/')) {
              router.push(callbackUrl);
            } else {
              router.push('/');
            }
          }, 1000);
        }
      } else {
        const data = await res.json();
        setErrors({ general: data.message || "Registration failed" });
      }
    } catch (err) {
      setErrors({ general: (err as Error).message || "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setErrors((prev) => ({ ...prev, password: undefined }));
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirm(e.target.value);
    setErrors((prev) => ({ ...prev, confirm: undefined }));
  };

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  // Don't render signup form if already authenticated
  if (status === 'authenticated') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <span>Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Create a new account</h1>
          <p className="mt-2 text-sm text-foreground/70">Sign up to start shopping with us.</p>
        </div>

        {errors.general && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              className="w-full rounded border px-3 py-2"
              placeholder="John Doe"
              disabled={loading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={handleEmailChange}
              className="w-full rounded border px-3 py-2"
              placeholder="you@example.com"
              disabled={loading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={handlePasswordChange}
                className="w-full rounded border px-3 py-2"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirm}
                onChange={handleConfirmChange}
                className="w-full rounded border px-3 py-2"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirm && <p className="mt-1 text-sm text-red-600">{errors.confirm}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-60 font-medium transition-colors"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/60">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}