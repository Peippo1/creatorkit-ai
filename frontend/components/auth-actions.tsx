"use client"

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

export function AuthActions() {
  return (
    <div className="auth-actions">
      <SignedOut>
        <a className="button button--ghost" href="/sign-in">
          Sign in
        </a>
        <a className="button" href="/sign-up">
          Create account
        </a>
      </SignedOut>
      <SignedIn>
        <div className="auth-actions__signed-in">
          <span className="auth-actions__label">Signed in</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
    </div>
  )
}
