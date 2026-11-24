import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const JIRA_KEY = /^[A-Z][A-Z0-9]+-\d+$/;

export function isJiraKey(ref) {
  return JIRA_KEY.test(String(ref).trim());
}

export function jiraKeyFromRef(ref) {
  const text = String(ref).trim();
  if (isJiraKey(text)) {
    return text;
  }
  const browse = text.match(/atlassian\.net\/browse\/([A-Z][A-Z0-9]+-\d+)/i);
  return browse ? browse[1].toUpperCase() : null;
}

function adfToText(node) {
  if (node == null) {
    return '';
  }
  if (typeof node === 'string') {
    return node;
  }
  if (node.type === 'text') {
    return node.text || '';
  }
  const inner = (node.content || []).map(adfToText).join('');
  if (node.type === 'paragraph' || node.type === 'heading') {
    return `${inner}\n`;
  }
  if (node.type === 'listItem') {
    return `- ${inner}`;
  }
  return inner;
}

function personName(value) {
  const name = value && value.displayName;
  if (!name || /^unassigned$/i.test(name)) {
    return '';
  }
  return name;
}

export function formatJiraIssue(issue) {
  const fields = issue.fields || {};
  const description =
    typeof fields.description === 'string'
      ? fields.description
      : adfToText(fields.description).trim();
  const comments = (fields.comment && fields.comment.comments) || [];
  const commentText = comments
    .map((comment) => {
      const body =
        typeof comment.body === 'string'
          ? comment.body
          : adfToText(comment.body).trim();
      return `comment by ${personName(comment.author) || 'unknown'}: ${body}`;
    })
    .join('\n');
  return [
    `key: ${issue.key || ''}`,
    `summary: ${fields.summary || ''}`,
    `reporter: ${personName(fields.reporter)}`,
    `assignee: ${personName(fields.assignee)}`,
    `creator: ${personName(fields.creator)}`,
    '',
    description,
    commentText,
  ]
    .filter((line) => line !== '')
    .join('\n');
}

function readJira(key) {
  const email = process.env.ATLASSIAN_EMAIL || process.env.JIRA_EMAIL || '';
  const token =
    process.env.ATLASSIAN_API_TOKEN || process.env.JIRA_API_TOKEN || '';
  const site = process.env.ATLASSIAN_SITE || 'mattermost.atlassian.net';
  if (!email || !token) {
    return null;
  }
  const url = `https://${site}/rest/api/3/issue/${encodeURIComponent(key)}?fields=summary,description,comment,reporter,assignee,creator`;
  try {
    const out = execFileSync(
      'curl',
      [
        '-fsS',
        '--max-time',
        '20',
        '-u',
        `${email}:${token}`,
        '-H',
        'Accept: application/json',
        url,
      ],
      { encoding: 'utf8', timeout: 25000, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const issue = JSON.parse(out);
    if (!issue || !issue.fields) {
      return null;
    }
    return formatJiraIssue(issue);
  } catch {
    return null;
  }
}

function readGithub(ref) {
  const match = String(ref).match(
    /github\.com\/([^/\s]+)\/([^/\s]+)\/(issues|pull)\/(\d+)/,
  );
  const short = String(ref).match(/^([^/\s]+)\/([^/\s]+)#(\d+)$/);
  const owner = match ? match[1] : short ? short[1] : null;
  const repo = match ? match[2] : short ? short[2] : null;
  const kind = match ? match[3] : short ? 'issues' : null;
  const number = match ? match[4] : short ? short[3] : null;
  if (!owner) {
    return null;
  }
  try {
    const out = execFileSync(
      'gh',
      [
        kind === 'pull' ? 'pr' : 'issue',
        'view',
        number,
        '--repo',
        `${owner}/${repo}`,
        '--json',
        'title,body,comments',
      ],
      {
        encoding: 'utf8',
        timeout: 20000,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
          GH_PROMPT_DISABLED: '1',
        },
      },
    );
    const json = JSON.parse(out);
    const comments = (json.comments || [])
      .map((comment) => {
        const author =
          (comment.author && (comment.author.login || comment.author.name)) ||
          'unknown';
        return `comment by ${author}: ${comment.body || ''}`;
      })
      .join('\n');
    return [`summary: ${json.title || ''}`, '', json.body || '', comments]
      .filter((line) => line !== '')
      .join('\n');
  } catch {
    return null;
  }
}

export function readFullSource(ref, sourceFile) {
  if (sourceFile) {
    if (!fs.existsSync(sourceFile)) {
      return { text: '', fetch: 'unreadable' };
    }
    const text = fs.readFileSync(sourceFile, 'utf8');
    if (!text.trim()) {
      return { text: '', fetch: 'unreadable' };
    }
    return { text, fetch: 'source-file' };
  }
  if (fs.existsSync(ref) && fs.statSync(ref).isFile()) {
    const text = fs.readFileSync(ref, 'utf8');
    if (!text.trim()) {
      return { text: '', fetch: 'unreadable' };
    }
    return { text, fetch: 'local' };
  }
  const jiraKey = jiraKeyFromRef(ref);
  if (jiraKey) {
    const text = readJira(jiraKey);
    if (!text || !text.trim()) {
      return { text: '', fetch: 'unreadable' };
    }
    return { text, fetch: 'jira' };
  }
  if (/github\.com\/|\/[^/\s]+#\d+$/.test(String(ref))) {
    const text = readGithub(ref);
    if (!text || !text.trim()) {
      return { text: '', fetch: 'unreadable' };
    }
    return { text, fetch: 'github-read' };
  }
  return { text: '', fetch: 'unreadable' };
}
