"use client"

import { useMemo } from "react"

type InsightTerm = {
  term: string
  explanation: string
}

interface CaptionWithInsightsProps {
  text: string
  terms: InsightTerm[]
}

type Segment =
  | { kind: "text"; value: string }
  | { kind: "term"; value: string; explanation: string }

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function buildSegments(text: string, terms: InsightTerm[]): Segment[] {
  if (!terms.length || !text.trim()) {
    return [{ kind: "text", value: text }]
  }

  const uniqueTerms = Array.from(
    new Map(
      terms.map((term) => [term.term.toLowerCase(), term])
    ).values()
  ).filter((term) => term.term.trim().length > 0)

  if (!uniqueTerms.length) {
    return [{ kind: "text", value: text }]
  }

  const pattern = uniqueTerms
    .map((term) => escapeRegExp(term.term))
    .join("|")
  const regex = new RegExp(`(${pattern})`, "gi")

  const segments: Segment[] = []
  let lastIndex = 0

  text.replace(regex, (match, _group, offset) => {
    if (offset > lastIndex) {
      segments.push({
        kind: "text",
        value: text.slice(lastIndex, offset),
      })
    }

    const matchedTerm = uniqueTerms.find(
      (term) => term.term.toLowerCase() === match.toLowerCase()
    )

    if (matchedTerm) {
      segments.push({
        kind: "term",
        value: match,
        explanation: matchedTerm.explanation,
      })
    } else {
      segments.push({
        kind: "text",
        value: match,
      })
    }

    lastIndex = offset + match.length
    return match
  })

  if (lastIndex < text.length) {
    segments.push({
      kind: "text",
      value: text.slice(lastIndex),
    })
  }

  return segments
}

export function CaptionWithInsights({ text, terms }: CaptionWithInsightsProps) {
  const segments = useMemo(() => buildSegments(text, terms), [text, terms])

  return (
    <p className="leading-relaxed text-gray-800 dark:text-gray-200">
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          return <span key={`${segment.value}-${index}`}>{segment.value}</span>
        }

        return (
          <span
            key={`${segment.value}-${index}`}
            className="group relative inline-block font-semibold text-purple-700 dark:text-purple-300"
          >
            <span className="rounded-sm bg-purple-100 px-1 dark:bg-purple-900/40">
              {segment.value}
            </span>
            <span className="absolute left-1/2 top-full z-20 mt-1 hidden w-56 -translate-x-1/2 rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-normal text-gray-700 shadow-lg transition-opacity dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 group-hover:block">
              <span className="block text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
                Meaning
              </span>
              <span className="mt-1 block text-left leading-snug">
                {segment.explanation}
              </span>
            </span>
          </span>
        )
      })}
    </p>
  )
}
