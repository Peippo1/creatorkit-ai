"use client"

import { useEffect, useState } from "react"

import { updateCreatorAccount } from "@/lib/api"
import type { CreatorAccountResponse } from "@/lib/types"

type CreatorAccountPanelProps = {
  account: CreatorAccountResponse | null
  isLoading: boolean
  error: string | null
  onUpdated: (account: CreatorAccountResponse) => void
}

type CreatorAccountForm = {
  display_name: string
  niche: string
  brand_name: string
  preferred_platform: string
  email: string
}

const EMPTY_FORM: CreatorAccountForm = {
  display_name: "",
  niche: "",
  brand_name: "",
  preferred_platform: "",
  email: "",
}

export function CreatorAccountPanel({
  account,
  isLoading,
  error,
  onUpdated,
}: CreatorAccountPanelProps) {
  const [form, setForm] = useState<CreatorAccountForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (account) {
      setForm({
        display_name: account.account.display_name,
        niche: account.account.niche,
        brand_name: account.account.brand_name,
        preferred_platform: account.account.preferred_platform,
        email: account.account.email,
      })
    }
  }, [account])

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)

    try {
      const nextAccount = await updateCreatorAccount(
        {
          display_name: form.display_name,
          niche: form.niche,
          brand_name: form.brand_name,
          preferred_platform: form.preferred_platform,
          email: form.email,
        },
      )
      onUpdated(nextAccount)
    } catch (updateError) {
      setSaveError(
        updateError instanceof Error ? updateError.message : "Unable to update creator account",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="panel account-panel">
      <div className="panel-heading">
        <div>
          <span className="panel-label">Account</span>
          <h2>Creator profile</h2>
        </div>
        {account ? (
          <div className="account-panel__stats">
            <strong>{account.analyses_count}</strong>
            <span>analyses</span>
            <strong>{account.drafts_count}</strong>
            <span>drafts</span>
          </div>
        ) : null}
      </div>

      {isLoading ? <p>Loading account...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {saveError ? <p className="error-text">{saveError}</p> : null}

      {account ? (
        <div className="account-panel__body">
          <div className="field">
            <label htmlFor="creator_display_name">Display name</label>
            <input
              id="creator_display_name"
              value={form.display_name}
              onChange={(event) =>
                setForm((current) => ({ ...current, display_name: event.target.value }))
              }
              placeholder="How you want the profile to read"
            />
          </div>

          <div className="field">
            <label htmlFor="creator_email">Email</label>
            <input
              id="creator_email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="hello@creator.com"
            />
          </div>

          <div className="field">
            <label htmlFor="creator_niche">Niche</label>
            <input
              id="creator_niche"
              value={form.niche}
              onChange={(event) => setForm((current) => ({ ...current, niche: event.target.value }))}
              placeholder="creator education"
            />
          </div>

          <div className="field">
            <label htmlFor="creator_brand_name">Brand name</label>
            <input
              id="creator_brand_name"
              value={form.brand_name}
              onChange={(event) =>
                setForm((current) => ({ ...current, brand_name: event.target.value }))
              }
              placeholder="Studio name or creator brand"
            />
          </div>

          <div className="field full">
            <label htmlFor="creator_platform">Primary platform</label>
            <input
              id="creator_platform"
              value={form.preferred_platform}
              onChange={(event) =>
                setForm((current) => ({ ...current, preferred_platform: event.target.value }))
              }
              placeholder="TikTok, YouTube, LinkedIn"
            />
          </div>

          <div className="actions">
            <button className="button" type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      ) : (
        <p className="muted">No profile loaded yet.</p>
      )}
    </section>
  )
}
