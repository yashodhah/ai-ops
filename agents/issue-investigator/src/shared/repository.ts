import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

export interface Repository {
  /** Absolute, realpath'd, verified git top-level directory. */
  readonly root: string;
  /** Which resolver matched. For logs only. */
  readonly provider: string;
  /**
   * Copies git-visible text files into a plain object keyed by `${prefix}/${relativePath}`.
   * Excludes: gitignored files, symlinks, binary files, files > MAX_FILE bytes,
   * and everything after the MAX_TOTAL byte budget is reached.
   */
  snapshot(prefix: string): Record<string, string>;
}

export const MAX_FILE = 256 * 1024;
export const MAX_TOTAL = 20 * 1024 * 1024;

type Resolver = {
  name: string;
  resolve(env: NodeJS.ProcessEnv): string | undefined;
};

function git(cwd: string, args: string[]): string | undefined {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    }).trim();
  } catch {
    return undefined;
  }
}

// Order matters: explicit override, then CI-specific, then local fallback.
const resolvers: Resolver[] = [
  { name: 'explicit', resolve: (e) => e.FLUE_REPO_ROOT || undefined },
  {
    name: 'github-actions',
    resolve: (e) => (e.GITHUB_ACTIONS === 'true' ? e.GITHUB_WORKSPACE || undefined : undefined),
  },
  { name: 'local', resolve: () => git(process.cwd(), ['rev-parse', '--show-toplevel']) },
];

export function resolveRepository(env: NodeJS.ProcessEnv = process.env): Repository {
  for (const r of resolvers) {
    const candidate = r.resolve(env);
    if (!candidate) continue;

    let root: string;
    try {
      root = realpathSync(candidate);
    } catch {
      throw new Error(`[${r.name}] path does not exist: ${candidate}`);
    }

    const top = git(root, ['rev-parse', '--show-toplevel']);
    if (!top || realpathSync(top) !== root) {
      throw new Error(`[${r.name}] ${root} is not the root of a git repository`);
    }
    return { root, provider: r.name, snapshot: (prefix) => snapshot(root, prefix) };
  }
  throw new Error('Could not locate a repository. Set FLUE_REPO_ROOT or run inside a git repo.');
}

function snapshot(root: string, prefix: string): Record<string, string> {
  const raw = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    maxBuffer: 64 * 1024 * 1024,
  }).toString('utf8');

  const out: Record<string, string> = {};
  let total = 0;
  let skipped = 0;

  for (const rel of raw.split('\0').filter(Boolean)) {
    const abs = path.join(root, rel);
    let st;
    try {
      st = lstatSync(abs);
    } catch {
      skipped++; // listed by git but deleted on disk
      continue;
    }
    if (!st.isFile() || st.size > MAX_FILE) {
      skipped++; // symlink, submodule, directory, or too big
      continue;
    }
    const buf = readFileSync(abs);
    if (buf.includes(0)) {
      skipped++; // binary
      continue;
    }
    if (total + buf.length > MAX_TOTAL) {
      skipped++;
      break;
    }
    total += buf.length;
    out[`${prefix}/${rel}`] = buf.toString('utf8');
  }

  console.error(`[repository] snapshot: ${Object.keys(out).length} files, ${total} bytes, ${skipped} skipped`);
  return out;
}
