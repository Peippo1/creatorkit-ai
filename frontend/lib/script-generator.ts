import type { AnalyzeRequest } from "@/lib/types"

type GenerateScriptInput = Pick<AnalyzeRequest, "platform" | "content_type" | "niche">

export type GeneratedScriptDraft = Pick<AnalyzeRequest, "hook" | "caption" | "transcript">

function normalizeText(value: string): string {
  return value.split(/\s+/).filter(Boolean).join(" ").trim()
}

function lowerPlatform(platform: string): string {
  return normalizeText(platform).toLowerCase()
}

function topicPhrase(niche: string): string {
  const cleaned = normalizeText(niche)
  return cleaned || "your topic"
}

function contentTypeLabel(contentType: string): string {
  switch (contentType) {
    case "short_video":
      return "short-form video"
    case "hook_led_video":
      return "hook-led video"
    case "educational_carousel":
      return "carousel"
    case "text_post":
      return "post"
    case "long_form":
      return "long-form script"
    case "thread":
      return "thread"
    case "tutorial":
      return "tutorial"
    default:
      return "video"
  }
}

function hookFormatLabel(contentType: string): string {
  switch (contentType) {
    case "short_video":
      return "short-form video"
    case "hook_led_video":
      return "opening"
    case "educational_carousel":
      return "carousel"
    case "text_post":
      return "post"
    case "long_form":
      return "script"
    case "thread":
      return "thread"
    case "tutorial":
      return "tutorial"
    default:
      return "draft"
  }
}

function hookFor(input: GenerateScriptInput, topic: string): string {
  const platform = lowerPlatform(input.platform)
  const format = hookFormatLabel(input.content_type)

  if (platform === "tiktok") {
    return `Stop the scroll: a sharper ${format} for ${topic}.`
  }

  if (platform === "instagram reels") {
    return `Make the first second count with a clearer ${format} for ${topic}.`
  }

  if (platform === "youtube shorts") {
    return `Watch this before you post your next ${format} for ${topic}.`
  }

  if (platform === "youtube") {
    return `Here’s the simplest way to explain ${topic} in a ${format}.`
  }

  if (platform === "linkedin") {
    return `A clearer way to open a LinkedIn post about ${topic}.`
  }

  if (platform === "x") {
    return `A faster way to make your point about ${topic}.`
  }

  if (platform === "threads") {
    return `A simple opening for a thread about ${topic}.`
  }

  return `A clearer opening for ${topic}.`
}

function transcriptFor(input: GenerateScriptInput, topic: string): string {
  const platform = lowerPlatform(input.platform)
  const format = contentTypeLabel(input.content_type)

  if (input.content_type === "long_form" || platform === "youtube") {
    return [
      `Open with the problem your audience feels around ${topic}.`,
      `Show why the usual approach falls short in this ${format}.`,
      "Walk through the fix in a few clear steps.",
      "Close with one direct next move.",
    ].join(" ")
  }

  if (input.content_type === "educational_carousel" || input.content_type === "thread") {
    return [
      `Open with the main point about ${topic}.`,
      "Add one concrete example so the idea feels real.",
      "Keep the language concise and easy to scan.",
      "Finish with a clear takeaway or question.",
    ].join(" ")
  }

  if (platform === "linkedin") {
    return [
      `Lead with a simple point about ${topic}.`,
      "Share one practical example that makes it credible.",
      "Keep the tone calm, clear, and professional.",
      "End with a direct next step or reflection.",
    ].join(" ")
  }

  if (platform === "x" || platform === "threads") {
    return [
      `Start with the quickest useful point about ${topic}.`,
      "Use short lines and one strong example.",
      "Keep the idea easy to skim and easy to share.",
      "Close with a simple takeaway.",
    ].join(" ")
  }

  return [
    `Start with the hook for ${topic}.`,
    "Show one quick example that makes the point obvious.",
    "Keep the pace tight and the value easy to see.",
    "End with one simple next step.",
  ].join(" ")
}

function captionFor(input: GenerateScriptInput, topic: string): string {
  const platform = lowerPlatform(input.platform)

  if (platform === "linkedin") {
    return `A starting point for a sharper post about ${topic}.`
  }

  if (platform === "youtube") {
    return `A simple outline you can turn into a stronger script about ${topic}.`
  }

  if (platform === "x" || platform === "threads") {
    return `A clean opening idea for ${topic}.`
  }

  if (platform === "tiktok" || platform === "instagram reels" || platform === "youtube shorts") {
    return `A short draft to tighten before you post about ${topic}.`
  }

  return `A starting point for a clearer draft about ${topic}.`
}

export function generateScriptDraft(input: GenerateScriptInput): GeneratedScriptDraft {
  const topic = topicPhrase(input.niche)

  return {
    hook: hookFor(input, topic),
    caption: captionFor(input, topic),
    transcript: transcriptFor(input, topic),
  }
}
