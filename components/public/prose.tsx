/**
 * Sanitized HTML prose renderer.
 * Body content is pre-sanitized on write (admin side) — this component
 * renders it verbatim inside a prose container. Never use with user-supplied
 * raw HTML; only use with DB-stored body fields that passed sanitization.
 */

interface ProseProps {
  html: string;
  className?: string;
}

export function Prose({ html, className }: ProseProps) {
  return (
    <>
      <style>{`
        .prose-content h2 { margin-top: 2.5rem; margin-bottom: 1rem; font-size: 1.5rem; font-weight: 700; color: #111827; }
        .prose-content h3 { margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.25rem; font-weight: 600; color: #111827; }
        .prose-content h4 { margin-top: 1.5rem; margin-bottom: 0.5rem; font-size: 1.125rem; font-weight: 600; color: #111827; }
        .prose-content p { margin-top: 1rem; margin-bottom: 1rem; color: #1f2937; line-height: 1.75; }
        .prose-content a { color: #0b3d2e; text-decoration: underline; text-underline-offset: 2px; }
        .prose-content a:hover { color: #2ecc71; }
        .prose-content ul { margin-top: 1rem; margin-bottom: 1rem; padding-inline-start: 1.5rem; list-style-type: disc; }
        .prose-content ol { margin-top: 1rem; margin-bottom: 1rem; padding-inline-start: 1.5rem; list-style-type: decimal; }
        .prose-content li { margin-top: 0.25rem; margin-bottom: 0.25rem; color: #1f2937; }
        .prose-content blockquote { margin-top: 1.5rem; margin-bottom: 1.5rem; border-inline-start: 4px solid #0b3d2e; padding-inline-start: 1rem; font-style: italic; color: #6b7280; }
        .prose-content code { border-radius: 0.25rem; background-color: #f3f4f6; padding: 0.125rem 0.375rem; font-size: 0.875rem; font-family: monospace; }
        .prose-content pre { margin-top: 1.5rem; margin-bottom: 1.5rem; overflow-x: auto; border-radius: 0.5rem; background-color: #f3f4f6; padding: 1rem; }
        .prose-content hr { margin-top: 2rem; margin-bottom: 2rem; border-color: #e5e7eb; }
        .prose-content img { margin-top: 1.5rem; margin-bottom: 1.5rem; border-radius: 0.5rem; width: 100%; height: auto; }
        .prose-content strong { font-weight: 700; color: #111827; }
      `}</style>
      <div
        className={`prose-content max-w-none${className ? ` ${className}` : ""}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
