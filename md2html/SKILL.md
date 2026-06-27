---
name: md2html
description: Convert long-form Markdown (plan, spec, system design, RFC, runbook, postmortem, brainstorm, notes) into a single self-contained HTML page with Mermaid diagrams, syntax-highlighted code, step timelines, callouts, sidebar TOC. Claude-orange light+dark theme. Multi-language. Portable across Claude Code / Codex / Antigravity / any AI agent.
trigger: /md2html
---

# /md2html

Convert a verbose Markdown document into a single, self-contained HTML file that a tired human can actually scan: diagrams instead of paragraphs, step cards instead of numbered lists, callouts for the parts that matter.

## Usage

```
/md2html <file.md>             # output .html at same path as source .md
/md2html <file.md> --out X.html # custom output path
/md2html                       # if no arg, ask user which file
```

**Output path rule**: By default, the output .html file is written to the same directory as the source .md, with the same basename but `.html` extension. E.g. `docs/release-notes-v1.md` → `docs/release-notes-v1.html`.

## Skill files (resolved relative to this SKILL.md)

- `template.html`   — HTML skeleton with embedded CSS (Claude orange light+dark), Mermaid CDN, Highlight.js CDN, KaTeX CDN, theme toggle, TOC sidebar, footer. Contains `{{PLACEHOLDER}}` strings and `<!-- COMMENT -->` slots.
- `components.md`  — catalog of HTML snippets you must copy verbatim (step cards, callouts, mermaid blocks, pros-cons, comparison cards, collapsibles, code blocks, formula examples).
- `latex.md`       — LaTeX / KaTeX writing and verification rules. Read this file only when the source document contains formulas or formula-like technical expressions.
- `examples/`     — at least one reference `<doc>.md` → body-only `<doc>.html` pair. Read one to calibrate component composition before starting.

**You MUST read `components.md` and one example pair before writing output.** Do not read the full `template.html`; read only the main/content/footer contract around `<main class="content" id="main">`, `<!-- CONTENT_START -->`, `<!-- CONTENT_END -->`, and `<footer class="doc-footer">` if you need to confirm insertion points. If formulas are present, you MUST also read `latex.md`. Do not invent CSS classes or skip the catalog.

## What you must do when invoked

Follow these steps in order. Do not skip.

### Step 1 — Resolve inputs

1. Determine the source file from the user's invocation. If none given, ask: *"Tệp `.md` nào cần convert?"* and stop.
2. Read the source `.md` fully.
3. Read `components.md` from the same directory as this SKILL.md.
4. Read one example pair under `examples/` to calibrate component composition. The example HTML is body-only and intentionally omits template CSS and scripts.
5. Do not read the full `template.html`; only inspect the main/content/footer contract if needed.
6. If the source document contains formulas or formula-like technical expressions, read `latex.md` from the same directory as this SKILL.md before generating HTML.

### Step 2 — Analyze the source document

Do this analysis silently in your head (or as one short summary line to the user). Identify:

- **Language of the source** — detect from the actual prose, not the filename. Set `<html lang="...">` to the ISO 639-1 code (`en`, `vi`, `zh`, `ja`, `ko`, `es`, `fr`, `de`, `ru`, `ar`, `th`, …) and translate every UI label to that language.

  Common samples (extend to any language using the same scheme):

  | Key            | EN                 | VI                 | ZH (中文)           | JA (日本語)         | KO (한국어)         | ES (Español)        |
  |---             |---                 |---                 |---                  |---                  |---                  |---                  |
  | TOC title      | Contents           | Mục lục            | 目录                | 目次                | 목차                | Contenido           |
  | Read-time      | ~N min read        | ~N phút đọc        | ~N 分钟阅读         | ~N 分で読了         | ~N분 소요           | ~N min de lectura   |
  | Recommended    | ★ Recommended      | ★ Đề xuất          | ★ 推荐              | ★ 推奨              | ★ 추천              | ★ Recomendado       |
  | Key point      | Key point          | Ý chính            | 要点                | 要点                | 핵심                | Idea clave          |
  | Pros           | ✓ Pros             | ✓ Ưu điểm          | ✓ 优点              | ✓ 長所              | ✓ 장점              | ✓ Ventajas          |
  | Cons           | ✕ Cons             | ✕ Nhược điểm       | ✕ 缺点              | ✕ 短所              | ✕ 단점              | ✕ Desventajas       |
  | Print tooltip  | Print / Save PDF   | In / Lưu PDF       | 打印 / 保存 PDF     | 印刷 / PDF 保存     | 인쇄 / PDF 저장     | Imprimir / Guardar  |
  | Theme tooltip  | Toggle theme       | Đổi theme          | 切换主题            | テーマ切替          | 테마 전환           | Cambiar tema        |
  | Source: prefix | Source:            | Nguồn:             | 来源:               | ソース:             | 소스:               | Fuente:             |

  For any language not listed, translate using the same conventions. The "Recommended" badge is configured via the `--rec-label` CSS variable set on `<html>` (no per-language CSS needed) — see `{{REC_LABEL}}` below.

  **RTL languages** (Arabic, Hebrew, Persian) — set `{{DIR_ATTR}}` to ` dir="rtl"`. For LTR languages, set `{{DIR_ATTR}}` to an empty string. RTL remains a known visual limitation because the sidebar stays on the left.

- **Title** — from first H1 or filename. Title should be ≤ 80 chars.
- **Subtitle** — first paragraph after H1, or the document's TL;DR sentence. ≤ 200 chars.
- **Doc type** — infer one of: `PLAN`, `SPEC`, `SYSTEM DESIGN`, `RFC`, `RUNBOOK`, `POSTMORTEM`, `BRAINSTORM`, `NOTES`. Pick the closest match based on the document's *purpose*, not its filename. Brainstorm = exploring options with rationale; Plan = ordered steps to a goal; Spec = exact behavior contract; System design = architecture + tradeoffs; RFC = proposal seeking feedback; Runbook = operational procedure; Postmortem = incident review. The uppercase code in the eyebrow stays universal; the topbar `BRAND_LABEL` localizes (Plan / Kế hoạch / 计划 / etc).
- **Reading time** — words ÷ 250, round to nearest minute. Format: `~N min read` (EN) or `~N phút đọc` (VI).
- **Section map** — walk each H2/H3 and tag with the BEST component using §11 cheatsheet in `components.md`:
  - numbered action list → Timeline
  - architecture/flow prose → Mermaid
  - "ưu/nhược", "pros/cons" → Pros-Cons
  - "option A vs B" → Comparison cards
  - critical conclusion → Key-point highlight
  - warnings/decisions → Callouts
  - long appendix → Collapsible
  - everything else → plain `<h2>` + `<p>`
- **Math / LaTeX usage** — detect whether the source contains formulas or formula-like technical expressions. If yes, follow `latex.md` for formula conversion, rendering rules, and verification. `template.html` already includes KaTeX assets and display-formula CSS; do not inject KaTeX assets during generation. Use `\(...\)` for inline formulas and `$$...$$` or `\[...\]` for display formulas.

### Step 3 — Build the output HTML from the template

Use `template.html` as the page skeleton. Do not rewrite the template by hand and do not regenerate its style, script, SVG sprite, footer, or layout.

The overall structure is:

```
1. Copy template.html to the output path.
2. Replace known placeholders across the copied output file.
3. Replace <!-- TOC_ENTRIES --> with generated TOC links.
4. Replace the content slot between <!-- CONTENT_START --> and <!-- CONTENT_END -->.
5. Verify the generated output.
```

#### Phase 1: Copy the template

Copy `template.html` to the output path with the platform's normal file-copy command. The copied file is the only file to edit.

```bash
cp /absolute/path/to/template.html /absolute/path/to/output.html
```

Do not read the full template into the conversation. The placeholder contract is listed below and the content insertion markers are stable.

#### Phase 2: Replace placeholders

Replace these placeholders in the copied output file. Values come from Step 2 analysis and must match the source language:

- `{{LANG}}` → ISO 639-1 code: `en` / `vi` / `zh` / `ja` / `ko` / `es` / …
- `{{DIR_ATTR}}` → ` dir="rtl"` for RTL languages; empty string for LTR languages
- `{{REC_LABEL}}` → text shown on the "Recommended" comparison-card badge
- `{{TITLE}}` → title used in both `<title>` and `.doc-title`
- `{{SUBTITLE}}`
- `{{DOC_TYPE}}` → universal uppercase code: `PLAN`, `SPEC`, `SYSTEM DESIGN`, `RFC`, `RUNBOOK`, `POSTMORTEM`, `BRAINSTORM`, `NOTES`
- `{{SOURCE_FILE}}` → basename of source, e.g. `plan.md`
- `{{DATE}}` → ISO date or localized "Updated <today>"
- `{{READ_TIME}}` → localized reading time
- `{{BRAND_LABEL}}` → localized doc-type label for the topbar
- `{{PRINT_TOOLTIP}}` → localized print tooltip
- `{{THEME_TOOLTIP}}` → localized theme-toggle tooltip
- `{{TOC_TITLE}}` → localized TOC title
- `{{CLOSE_LABEL}}` → localized "Close"
- `{{SKIP_LINK_LABEL}}` → localized skip-to-content link text
- `{{FOOTER_NOTE}}` → localized source attribution

#### Phase 3: Replace TOC and content slot

1. Replace `<!-- TOC_ENTRIES -->` with one `<a>` per H2/H3 (see §2 in `components.md`).
2. Replace only the content between `<!-- CONTENT_START -->` and `<!-- CONTENT_END -->` with generated section HTML.
3. Preserve the `<!-- CONTENT_START -->` and `<!-- CONTENT_END -->` markers in the output file.
4. Do not modify anything outside known placeholders, `<!-- TOC_ENTRIES -->`, or the content slot.

Guidelines per section:
- Start with `<h2 id="...">` or `<h3 id="...">` matching the TOC entry.
- Use ONE primary component per logical chunk.
- Preserve original meaning and technical identifiers.
- Use snippets from `components.md`; do not invent CSS classes.
- Write LaTeX formulas as semantic text. `template.html` already contains KaTeX assets and render logic.

### Step 4 — Verify

After writing, do a targeted sanity check:
- Every `id="..."` referenced in the TOC exists on a heading.
- No leftover `{{PLACEHOLDER}}` strings.
- `<!-- TOC_ENTRIES -->` is gone.
- The content slot contains generated section HTML between `<!-- CONTENT_START -->` and `<!-- CONTENT_END -->`.
- Mermaid blocks have valid syntax (use `flowchart`, `sequenceDiagram`, `erDiagram`, `stateDiagram-v2`, or `gantt` — never bare `graph` without direction).
- No `<script>` or `<style>` tags were added during generation. Mermaid, Highlight.js, and KaTeX are already part of `template.html`.

After verification passes, **automatically open the output file** in the user's default browser:
- macOS: `open <file>.html`
- Linux: `xdg-open <file>.html`

Then report back to the user with:
- Output file path
- 1-line summary of what changed (e.g. *"Rendered 7 sections: 1 mermaid flow, 2 step timelines, 4 callouts. ~6 phút đọc."*)

## Critical rules

1. **Never paraphrase technical content into vague prose.** A step `chạy migration 0042_user_schema.sql` must remain that exact filename — don't change to `chạy migration mới`.
2. **One component per chunk.** Don't wrap a callout inside a step card inside a collapsible. Keep nesting flat.
3. **Mermaid > prose for any flow ≥ 3 hops.** If the source says "A gọi B, B gọi C, C ghi DB", make a diagram.
4. **Key-point highlights are rare.** Max 1 per H2 section, ideally 2-3 total per document.
5. **UI text follows the detected source language** — including for non-EN/non-VI sources (Chinese, Japanese, Korean, Spanish, etc). Use the language sample table in Step 2 or translate equivalently. Code, commands, file names, library names, error messages stay verbatim regardless of language.
6. **External assets are restricted.** Do not add external file references during generation. Mermaid, Highlight.js, and KaTeX are already included in `template.html`.
7. **Do not modify `template.html` or `components.md` while generating output** — those are the skill's source of truth. Only edit the copied output `.html`.
8. **Use SVG icons only — never emojis.** Every icon is `<svg class="..."><use href="#i-NAME"/></svg>` referencing the sprite at the top of `<body>`. See §13 in `components.md` for the catalog. No emoji glyphs anywhere in callouts, doc-meta, topbar, or body content.
9. **Anchor links and copy-to-clipboard auto-inject via JS** — do NOT add them manually. Just give H2/H3 a proper `id`, and put code in `<pre><code>`. The template's boot script handles the rest.
10. **Wrap wide tables in `.table-wrap`** — see components.md §14b. Tables ≥ 4 columns or with long cells need the wrapper for mobile scroll.
11. **Use `<figure>` + `<figcaption>` for images** with descriptive `alt`. See components.md §14a.
12. **LaTeX formulas must remain semantic text.** When formulas are present, use LaTeX delimiters and KaTeX rendering as defined in `latex.md`; do not convert formulas to images, SVG drawings, screenshots, or vague prose.

## Cross-AI compatibility

This skill is designed to run identically on:

- **Claude Code** — install at `~/.claude/skills/md2html/` (this directory, symlinked or copied). Invoke with `/md2html <file>`.
- **Codex CLI** — copy `SKILL.md` content to `~/.codex/prompts/md2html.md`, keep `template.html` and `components.md` at a stable absolute path, update the file references in SKILL.md if needed. Invoke with `/md2html`.
- **Antigravity** — add SKILL.md as a custom prompt/agent instruction, ensure the agent has Read/Write tool access to the skill folder.

The default external dependencies are `mermaid`, `highlight.js`, and `KaTeX` via CDN (resolved at HTML open time, not at skill execution time). No npm/pip install is required for the skill itself.

## Edge cases

- **Source has no headings** — wrap content in one `<h2 id="content">Nội dung</h2>` and infer logical breaks from blank lines + topic shifts.
- **Source has existing mermaid code blocks** — keep them, just rewrap in `<figure class="diagram">` with caption.
- **Source has HTML embedded** — pass through as-is inside `<div>` if safe, else escape.
- **Source is very short (< 200 words)** — leave `<!-- TOC_ENTRIES -->` empty and keep the template structure intact. The template script hides the empty TOC.
- **Source is very long (> 5000 words)** — collapse low-priority sections by default with `<details>`.
- **Output file already exists** — overwrite. The source `.md` is canonical; HTML is regenerated artifact.

## Anti-patterns

- ❌ Rewriting the template by hand — copy `template.html` to the output path and replace only known placeholders, `<!-- TOC_ENTRIES -->`, and the content slot.
- ❌ Reading the full `template.html` into the conversation — use the placeholder contract and stable content markers instead.
- ❌ Adding new CSS via `<style>` in generated output — extend `template.html` instead and tell the user.
- ❌ Translating proper nouns or code identifiers.
- ❌ "Improving" the source by adding info not in the original.
- ❌ Reporting success without running Step 4 verification.
