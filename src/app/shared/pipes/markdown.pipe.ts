import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    return this.sanitizer.bypassSecurityTrustHtml(this.parse(value));
  }

  parse(s: string): string {
    return s
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\|(.+)\|$/gm, (row) => {
        const cells = row.split('|').filter((c) => c.trim() !== '');
        return '<tr>' + cells.map((c) => `<td>${c.trim()}</td>`).join('') + '</tr>';
      })
      .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (rows) => {
        const lines = rows
          .trim()
          .split('\n')
          .filter((l) => l.startsWith('<tr>'));
        if (lines.length < 2) return rows;
        const clean = lines.filter(
          (l) => !l.includes('<td>---</td>') && !l.includes('<td>-----</td>'),
        );
        if (!clean.length) return '';
        const hdr = clean[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
        return `<table>${hdr}${clean.slice(1).join('\n')}</table>`;
      })
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      .replace(/^---$/gm, '<hr>')
      .replace(/\n\n/g, '\n')
      .replace(/^(?!<[htulidbe\/])(.+\S.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '');
  }
}
