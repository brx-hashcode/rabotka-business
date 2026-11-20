"use client";

import type { ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { CHART_FENCE } from "../chart-spec";
import { AnswerChart } from "./answer-chart";

/**
 * How each mark of an answer looks: small headings, the site's green bullets,
 * tables that scroll on a phone, and the charts the server put in. Raw HTML
 * is never rendered (react-markdown's default), so an answer cannot inject
 * markup.
 */
const COMPONENTS: Components = {
  h1: ({ children }) => <p className="mt-4 mb-1.5 font-semibold text-base first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mt-4 mb-1.5 font-semibold text-base first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mt-4 mb-1.5 font-semibold first:mt-0">{children}</p>,
  h4: ({ children }) => <p className="mt-3 mb-1 font-semibold first:mt-0">{children}</p>,
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  // A green dot before each bullet; in a numbered list the number is the marker.
  ul: ({ children }) => (
    <ul className="my-2 space-y-1.5 [&>li]:relative [&>li]:pl-3.5 [&>li]:before:absolute [&>li]:before:top-[0.6em] [&>li]:before:left-0 [&>li]:before:size-1.5 [&>li]:before:rounded-full [&>li]:before:bg-whatsapp-dark [&>li]:before:content-['']">
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-muted-foreground">{children}</ol>,
  li: ({ children }) => <li className="min-w-0 [&>p]:my-0">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-medium underline underline-offset-2">
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-foreground/10" />,
  blockquote: ({ children }) => <blockquote className="my-2 rounded-2xl bg-page/70 px-4 py-2 text-muted-foreground">{children}</blockquote>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-2xl bg-page/70">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="text-muted-foreground text-xs">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
  td: ({ children }) => <td className="border-foreground/6 border-t px-3 py-2 align-top">{children}</td>,
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const source = String(children ?? "");
    if (className === `language-${CHART_FENCE}`) return <AnswerChart source={source} />;
    // Any other code: shown as it is, never run.
    return className ? (
      <pre className="my-2 overflow-x-auto rounded-2xl bg-page/70 px-4 py-3 text-xs">
        <code>{source}</code>
      </pre>
    ) : (
      <code className="rounded bg-page px-1 py-0.5 text-[0.9em]">{children as ReactNode}</code>
    );
  },
};

/** An answer of the assistant: markdown, with tables and charts. */
export function AnswerMarkdown({ text }: Readonly<{ text: string }>) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
      {text}
    </Markdown>
  );
}
