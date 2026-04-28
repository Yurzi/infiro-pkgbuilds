# AGENTS.md

This file defines the working rules for AI agents and human collaborators in the `infiro` repository. The goal is to let agents maintain this `lilac`-based Arch Linux repository safely and predictably, without touching unrelated packages, build artifacts, or cached upstream sources by mistake.

## 1. Repository Role

- This is an Arch Linux packaging repository organized as one package directory per package or package base.
- Each package directory usually contains at least:
  - `PKGBUILD`
  - `lilac.yaml`
- Some package directories also contain patches, service files, install hooks, sysusers/tmpfiles snippets, shell wrappers, or config fragments.
- `lilac.yaml` defines update tracking and build hooks.
- `PKGBUILD` defines the actual packaging logic.

## 2. Top-Level Layout

The repository root is primarily composed of package directories, for example:

```text
.
├── AGENTS.md
├── opencode/
│   ├── PKGBUILD
│   └── lilac.yaml
├── immich-cn/
│   ├── PKGBUILD
│   ├── lilac.yaml
│   ├── *.patch
│   ├── *.service
│   ├── *.install
│   └── *.conf
├── python-tencentcloud/
│   ├── PKGBUILD
│   ├── lilac.yaml
│   └── *.patch
└── ...
```

Common file roles:

- `PKGBUILD`: package metadata, dependencies, sources, build/package functions.
- `lilac.yaml`: `lilac` update rules, repo dependencies, pre/post build hooks.
- `*.patch`: upstream fixes or packaging-specific patches.
- `*.install`: pacman install scripts.
- `*.service`, `*.sysusers`, `*.tmpfiles`, `*.conf`: system integration files.
- `src/`, unpacked upstream trees, `*.pkg.tar.zst`, `*.log`, `*.tar.gz`, `*.zip`: usually build outputs, caches, or temporary files, and not normal edit targets.

## 3. Edit Boundaries

By default, an AI agent should only modify files directly related to the target package.

Allowed targets:

- `PKGBUILD` in the target package directory
- `lilac.yaml` in the target package directory
- Patches or helper files referenced by that package's `source=()`
- Repository-level collaboration documents such as `AGENTS.md`

Do not modify by default:

- Unrelated package directories
- `src/` directories
- Unpacked upstream source trees
- `*.pkg.tar.zst`
- `*.log`
- Downloaded source archives such as `*.tar.gz` and `*.zip`
- Generated files that are not intentionally maintained as source files

If the worktree already contains uncommitted changes:

- Do not revert them.
- Do not clean them up unless the task explicitly requires it.
- Read and accommodate them only when they are relevant to the current task.

## 4. Package Directory Conventions

Each package directory should stay close to this structure:

```text
pkgname/
├── PKGBUILD
├── lilac.yaml
├── optional patches / install hooks / service files / config snippets
└── no committed build artifacts unless intentionally preserved
```

Conventions:

- The directory name should normally match the main package name or package base, such as `immich-cn` or `postgresql-vectorchord`.
- Split packages may live in one directory, but the directory should reflect the `pkgbase` or primary project name.
- Helper files should use stable, descriptive names, for example:
  - `01-fix-xxx.patch`
  - `foo.install`
  - `foo.service`
  - `foo.conf`
- New patches should preferably use a numbered prefix plus a short intent description.

## 5. `lilac.yaml` Conventions

This repository commonly uses a structure like:

```yaml
maintainers:
  - github: Yurzi
    email: yurzi@foxmail.com

build_prefix: extra-x86_64

pre_build_script: |
  update_pkgver_and_pkgrel(_G.newver)

post_build_script: |
  git_pkgbuild_commit()

update_on:
  - source: github
    github: owner/repo
    use_latest_tag: true
```

Agents should follow these rules:

- Reuse existing repository patterns instead of inventing a new `lilac.yaml` style.
- Use `repo_depends` when a package depends on another package from this repository.
- Consider `lilac_throttle` for upstreams that update too frequently.
- Keep `pre_build_script` and `post_build_script` simple unless extra logic is necessary.
- Match `update_on` semantics to the upstream release model: tag vs release, prefix handling, throttling, and source type.

## 6. `PKGBUILD` Conventions

When editing `PKGBUILD`, an agent should:

- Preserve the existing style as much as possible.
- Avoid unrelated reformatting.
- Change only the sections relevant to the task.
- Keep `pkgver`, `pkgrel`, `source`, `sha256sums`, dependencies, and patch application logic consistent.
- Update `source=()` and checksums together when adding or removing source files.
- For split packages, verify that `package_*()` functions, package names, dependency arrays, `conflicts`, and `replaces` remain aligned.
- Never leave temporary debug commands, personal paths, or accidental local assumptions in the file.
- Add short comments only when they explain a non-obvious packaging constraint.

## 7. AI Workflow

Agents should normally work in this order:

1. Identify the target package directory and the exact files involved.
2. Read `PKGBUILD`, `lilac.yaml`, and any referenced patches or helper files first.
3. Only inspect other packages when needed as local reference material.
4. After editing, do a basic consistency pass:
   - `source=()` matches referenced files
   - checksums were updated if needed
   - `pkgver` / `pkgrel` are coherent
   - `lilac.yaml` remains valid and properly indented
   - split package names still match their packaging functions
5. If the environment allows it, run the smallest useful validation step, such as:
   - `makepkg --printsrcinfo`
   - `makepkg -o`
   - `makepkg --nobuild`
   - another targeted syntax or packaging check

If validation was not run, the final report must say so explicitly.

## 8. Commit Scope

Commits should stay small and single-purpose.

- One commit should address one clear change.
- Avoid mixing unrelated packages in the same commit unless the task is explicitly cross-package.
- Keep repository policy or documentation changes separate from package fixes when practical.
- Keep automatic version bumps separate from manual packaging fixes when practical.

## 9. Commit Message Format

The existing history uses this package-level format:

```text
<pkgdir>: auto updated to <version-release>
```

Examples from repository history:

```text
immich-cn: auto updated to 2.7.5-1
java-openjfx: auto updated to 27.14-1
tencentcloud-cli: auto updated to 3.1.81.1-1
```

Manual commits should follow the same overall style: a package directory name, a colon, and a concise English summary.

Preferred formats:

```text
<pkgdir>: <change summary>
repo: <change summary>
docs: <change summary>
ci: <change summary>
```

Rules:

- Use the repository directory name as the scope, not the upstream project name.
- Write the summary in English.
- Keep the subject concise and specific.
- Match the repository's existing lowercase, colon-based style.

Examples:

```text
immich-cn: fix machine-learning runtime path
java-openjfx: refresh patch for jdk25
tencentcloud-cli: add repo_depends on python-tencentcloud
opencode: update download URL pattern
docs: rewrite AGENTS.md in English
repo: add packaging workflow guidance
```

For automatic updates triggered by `lilac`, keep the established pattern:

```text
<pkgdir>: auto updated to <version-release>
```

## 10. Version Update Wording

Recommended subject wording:

- Version-only package bump:
  - `<pkgdir>: update to <version-release>`
- Automatic `lilac` update:
  - `<pkgdir>: auto updated to <version-release>`
- `pkgrel` rebuild only:
  - `<pkgdir>: rebuild for ...`
  - `<pkgdir>: bump pkgrel for ...`
- Build fix:
  - `<pkgdir>: fix build with ...`
- Dependency fix:
  - `<pkgdir>: fix depends`
  - `<pkgdir>: add missing optdepends`
  - `<pkgdir>: drop unused makedepends`

Avoid vague subjects such as:

- `update files`
- `misc fix`
- `try fix`
- `temp`

## 11. Things Agents Must Not Do

Agents must not:

- Delete user files or cached artifacts unless explicitly asked
- Rename package directories without an explicit repository-level decision
- Reformat the whole repository
- Make drive-by style fixes in unrelated packages
- Claim validation happened when it did not
- Change source URLs, checksums, or release tracking rules without verifying the intended behavior

## 12. Delivery Expectations

When finishing a task, the agent should clearly report:

- Which files were changed
- Why they were changed
- Whether validation was run; if not, why not
- Any remaining risk or points that need human confirmation

---

If the repository later gains a shared `.gitignore`, CI, `namcap` automation, bulk build scripts, or a more formal release workflow, this file should be updated accordingly.
