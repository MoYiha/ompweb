import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const GITHUB_REMOTE_URL_RE = /^(?:(?:https?|ssh|git):\/\/(?:[^@/]+@)?|[^@/:]+@)github\.com[/:]([A-Za-z0-9][A-Za-z0-9-]*)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/i;
const REPO_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9._-]+$/;
// gh CLI's default-remote priority when no `gh repo set-default` exists.
const REMOTE_PRIORITY = ["upstream", "github", "origin"];

export function parseGithubRemoteUrl(url: string): string | null {
  const match = GITHUB_REMOTE_URL_RE.exec(url.trim());
  return match ? `${match[1]}/${match[2]}` : null;
}

/**
 * Picks the GitHub repository the way `gh` does, from
 * `git config --get-regexp` output: the `gh repo set-default` remote
 * (`remote.<name>.gh-resolved`) wins, then upstream > github > origin > others.
 */
export function pickGithubRepo(gitConfig: string): string | null {
  const urls = new Map<string, string>();
  let resolved: { name: string; value: string } | undefined;
  for (const line of gitConfig.split("\n")) {
    const match = /^remote\.(.+)\.(url|gh-resolved) (.*)$/.exec(line.trim());
    if (!match) continue;
    const [, name, key, value] = match;
    if (key === "url") {
      if (!urls.has(name)) urls.set(name, value);
    } else {
      resolved ??= { name, value };
    }
  }
  if (resolved) {
    if (REPO_SLUG_RE.test(resolved.value)) return resolved.value;
    const url = urls.get(resolved.name);
    const repo = url ? parseGithubRemoteUrl(url) : null;
    if (repo) return repo;
  }
  const rank = (name: string) => {
    const index = REMOTE_PRIORITY.indexOf(name);
    return index === -1 ? REMOTE_PRIORITY.length : index;
  };
  for (const name of [...urls.keys()].sort((a, b) => rank(a) - rank(b))) {
    const repo = parseGithubRemoteUrl(urls.get(name)!);
    if (repo) return repo;
  }
  return null;
}

/** `owner/repo` for the checkout at `cwd`, or null (not a repo, no GitHub remote). */
export async function resolveGithubRepo(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", cwd, "config", "--get-regexp", "^remote\\..*\\.(url|gh-resolved)$"],
      { timeout: 5_000, env: { ...process.env, LC_ALL: "C" } },
    );
    return pickGithubRepo(stdout);
  } catch {
    return null;
  }
}
