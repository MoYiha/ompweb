import assert from "node:assert/strict";
import test from "node:test";

const { parseGithubRemoteUrl, pickGithubRepo } = await import("./github-repo.ts");

test("parses GitHub remote URL forms and rejects other hosts", () => {
  for (const url of [
    "https://github.com/o-1/r.x",
    "https://github.com/o-1/r.x.git",
    "https://token@github.com/o-1/r.x/",
    "git@github.com:o-1/r.x.git",
    "ssh://git@github.com/o-1/r.x.git",
  ]) {
    assert.equal(parseGithubRemoteUrl(url), "o-1/r.x", url);
  }
  assert.equal(parseGithubRemoteUrl("https://gitlab.com/o/r.git"), null);
  assert.equal(parseGithubRemoteUrl("https://github.com.evil.test/o/r"), null);
});

test("prefers the gh default remote, then upstream over origin", () => {
  const remotes = [
    "remote.origin.url git@github.com:fork/app.git",
    "remote.upstream.url https://github.com/main/app.git",
  ];
  assert.equal(pickGithubRepo(remotes.join("\n")), "main/app");
  assert.equal(pickGithubRepo([...remotes, "remote.origin.gh-resolved base"].join("\n")), "fork/app");
  assert.equal(pickGithubRepo([...remotes, "remote.origin.gh-resolved other/app"].join("\n")), "other/app");
});

test("skips non-GitHub remotes and returns null when none match", () => {
  assert.equal(pickGithubRepo("remote.upstream.url https://gitlab.com/x/y\nremote.mine.url git@github.com:me/y"), "me/y");
  assert.equal(pickGithubRepo("remote.origin.url /srv/repo.git"), null);
  assert.equal(pickGithubRepo(""), null);
});
