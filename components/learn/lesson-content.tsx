import { Fragment, type ReactNode } from 'react';

/** Renders **bold** spans as React elements (no HTML injection). */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Tiny parser for lesson bodies: paragraphs, "## " headings and "- " bullet lists. */
export function LessonContent({ body }: { body: string }) {
  const blocks = body.trim().split(/\n\s*\n/);
  const out: ReactNode[] = [];
  blocks.forEach((block, bi) => {
    const lines = block.split('\n');
    let para: string[] = [];
    let list: string[] = [];
    const flush = (k: string) => {
      if (para.length) out.push(<p key={`p${k}`}>{inline(para.join(' '))}</p>);
      if (list.length) out.push(<ul key={`u${k}`}>{list.map((li, i) => <li key={i}>{inline(li)}</li>)}</ul>);
      para = [];
      list = [];
    };
    lines.forEach((raw, li) => {
      const line = raw.trim();
      if (line.startsWith('## ')) {
        flush(`${bi}-${li}`);
        out.push(<h2 key={`h${bi}-${li}`}>{inline(line.slice(3))}</h2>);
      } else if (line.startsWith('- ')) {
        if (para.length) flush(`${bi}-${li}a`);
        list.push(line.slice(2));
      } else if (line) {
        if (list.length) flush(`${bi}-${li}b`);
        para.push(line);
      }
    });
    flush(`${bi}-end`);
  });
  return <div className="prose-lesson">{out}</div>;
}
