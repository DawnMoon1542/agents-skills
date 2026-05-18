---
name: md2html
description: Convert long-form Markdown (plan, spec, system design, RFC, runbook, postmortem, brainstorm, notes) into a single self-contained HTML page with Mermaid diagrams, step timelines, callouts, sidebar TOC. Claude-orange light+dark theme. Multi-language. Portable across Claude Code / Codex / Antigravity / any AI agent.
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

- `template.html`   — HTML skeleton with embedded CSS (Claude orange light+dark), Mermaid CDN, theme toggle, TOC sidebar, footer. Contains `{{PLACEHOLDER}}` strings and `<!-- COMMENT -->` slots.
- `components.md`  — catalog of HTML snippets you must copy verbatim (step cards, callouts, mermaid blocks, pros-cons, comparison cards, collapsibles).
- `examples/`     — at least one reference `<doc>.md` → `<doc>.html` pair. Read one to calibrate output quality before starting.

**You MUST read all three before writing output.** Do not invent CSS classes or skip the catalog.

## What you must do when invoked

Follow these steps in order. Do not skip.

### Step 1 — Resolve inputs

1. Determine the source file from the user's invocation. If none given, ask: *"Tệp `.md` nào cần convert?"* and stop.
2. Read the source `.md` fully.
3. Read `template.html` and `components.md` from the same directory as this SKILL.md.
4. Read one example pair under `examples/` to calibrate.

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

  **RTL languages** (Arabic, Hebrew, Persian) — current template is LTR-only. If source is RTL, also add `dir="rtl"` to `<html>` and consider it a known visual limitation (sidebar will stay on the left).

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

### Step 3 — Build the output HTML (segmented, for reliability)

To prevent tool call failures on large documents, build the HTML in multiple segments rather than a single `Write`. Use bash `cat >>` to append content pieces sequentially. The overall structure is:

```
┌─ Phase 1: Write skeleton prefix (head, topbar, TOC, doc header)
├─ Phase 2: Write each content section (append with cat >>)
├─ Phase 3: Write skeleton suffix (footer, scripts, closing tags)
└─ Phase 4: Insert TOC entries (a single edit() call)
```

#### Phase 1: Write skeleton prefix

1. **Copy** the full `template.html` content into a string. Do NOT use Read-then-Edit.
2. **Replace all placeholders EXCEPT `{{TOC_TITLE}}`-related ones and content body** (all values come from Step 2 analysis, language-matched):
   - `{{LANG}}` → ISO 639-1 code: `en` / `vi` / `zh` / `ja` / `ko` / `es` / …
   - `{{REC_LABEL}}` → text shown on the "Recommended" comparison-card badge
   - `{{TITLE}}` (appears twice: `<title>` and `.doc-title`)
   - `{{SUBTITLE}}`
   - `{{DOC_TYPE}}` → universal uppercase code: `PLAN`, `SPEC`, `SYSTEM DESIGN`, `RFC`, `RUNBOOK`, `POSTMORTEM`, `BRAINSTORM`, `NOTES`
   - `{{SOURCE_FILE}}` → basename of source (e.g. `plan.md`)
   - `{{DATE}}` → ISO date or localized "Updated <today>"
   - `{{READ_TIME}}` → localized reading time
   - `{{BRAND_LABEL}}` → localized doc-type label for the topbar
   - `{{PRINT_TOOLTIP}}` → localized print tooltip
   - `{{THEME_TOOLTIP}}` → localized theme-toggle tooltip
   - `{{CLOSE_LABEL}}` → localized "Close"
   - `{{SKIP_LINK_LABEL}}` → localized skip-to-content link text
   - `{{FOOTER_NOTE}}` → localized source attribution
3. **Trim the template to prefix only**: keep everything from `<!DOCTYPE html>` through `<!-- CONTENT_START -->` (inclusive). Remove everything from `<!-- CONTENT_END -->` onward (footer, `</main>`, `</div>`, scripts, `</html>`). Keep these removed parts aside as the "suffix".
4. **Replace TOC entries**: in the prefix, replace `<!-- TOC_ENTRIES -->` with one `<a>` per H2/H3 (see §2 in components.md).
5. **Write** the prefix to the output path with `Write` tool.

#### Phase 2: Write content sections (append)

For each content section (identified in Step 2's section map), **append** its HTML to the output file using bash:

```bash
cat >> <output>.html << 'SECTION_EOF'
<!-- your section HTML here -->
SECTION_EOF
```

Guidelines per section:
- Start with `<h2 id="...">` or `<h3 id="...">` (matching the TOC entry).
- Use ONE primary component per logical chunk (don't stack 3 callouts in a row).
- Preserve original meaning — do not summarize away technical detail; condense only filler/repetition.
- Use `cat >>` heredoc with a unique delimiter (e.g. `SECTION_EOF`, `SECTION_2_EOF`) — always use `'DELIMITER'` (quoted) to prevent shell variable expansion.
- After writing each section, run verification: re-read just that section (one quick sanity check) before moving to the next.

#### Phase 3: Write skeleton suffix (append)

Append the saved suffix (from `<!-- CONTENT_END -->` to `</html>` inclusive) using the same bash `cat >>` method:

```bash
cat >> <output>.html << 'SUFFIX_EOF'
<!-- CONTENT_END -->

      <footer class="doc-footer">
        <span>Generated by <a href="#">md2html</a></span>
        <span>{{FOOTER_NOTE}}</span>
      </footer>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script>
    ... (boot script) ...
  </script>
</body>
</html>
SUFFIX_EOF
```

> **Why bash `cat >>` instead of `edit`?** The `edit` tool matches against the original file content, not incrementally — chained edits targeting the same file would fail. Bash heredoc append (`cat >> file.html << 'DELIM'`) reliably appends text without shell expansion interference.

### Step 4 — Verify

After writing, do ONE quick sanity check by re-reading just the section you generated (not the whole file):
- Every `id="..."` referenced in the TOC exists on a heading.
- No leftover `{{PLACEHOLDER}}` strings.
- Mermaid blocks have valid syntax (use `flowchart`, `sequenceDiagram`, `erDiagram`, `stateDiagram-v2`, or `gantt` — never bare `graph` without direction).
- No `<script>` tags added beyond what `template.html` already includes.

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
6. **Self-contained output.** No external file references except the CDN scripts already in `template.html`.
7. **Do not modify `template.html` or `components.md`** — those are the skill's source of truth. Only Write the output `.html`.
8. **Use SVG icons only — never emojis.** Every icon is `<svg class="..."><use href="#i-NAME"/></svg>` referencing the sprite at the top of `<body>`. See §13 in `components.md` for the catalog. No emoji glyphs anywhere in callouts, doc-meta, topbar, or body content.
9. **Anchor links and copy-to-clipboard auto-inject via JS** — do NOT add them manually. Just give H2/H3 a proper `id`, and put code in `<pre><code>`. The template's boot script handles the rest.
10. **Wrap wide tables in `.table-wrap`** — see components.md §14b. Tables ≥ 4 columns or with long cells need the wrapper for mobile scroll.
11. **Use `<figure>` + `<figcaption>` for images** with descriptive `alt`. See components.md §14a.

## Cross-AI compatibility

This skill is designed to run identically on:

- **Claude Code** — install at `~/.claude/skills/md2html/` (this directory, symlinked or copied). Invoke with `/md2html <file>`.
- **Codex CLI** — copy `SKILL.md` content to `~/.codex/prompts/md2html.md`, keep `template.html` and `components.md` at a stable absolute path, update the file references in SKILL.md if needed. Invoke with `/md2html`.
- **Antigravity** — add SKILL.md as a custom prompt/agent instruction, ensure the agent has Read/Write tool access to the skill folder.

The only external dependency is `mermaid` via CDN (resolved at HTML open time, not at skill execution time). No npm/pip install required for the skill itself.

## Edge cases

- **Source has no headings** — wrap content in one `<h2 id="content">Nội dung</h2>` and infer logical breaks from blank lines + topic shifts.
- **Source has existing mermaid code blocks** — keep them, just rewrap in `<figure class="diagram">` with caption.
- **Source has HTML embedded** — pass through as-is inside `<div>` if safe, else escape.
- **Source is very short (< 200 words)** — skip TOC sidebar (delete `<aside class="toc">` block), render as single column.
- **Source is very long (> 5000 words)** — collapse low-priority sections by default with `<details>`.
- **Output file already exists** — overwrite. The source `.md` is canonical; HTML is regenerated artifact.

## Anti-patterns

- ❌ Generating the HTML in many small Edit calls — `edit` matches against original file content, not incrementally; chained edits will conflict. Use bash `cat >>` for progressive append instead.
- ❌ Writing the entire HTML in a single `Write` call for very large documents — the tool may fail on oversized payloads. Split into prefix (Write) + content sections (bash append) + suffix (bash append).
- ❌ Adding new CSS via `<style>` — extend `template.html` instead and tell the user.
- ❌ Translating proper nouns or code identifiers.
- ❌ "Improving" the source by adding info not in the original.
- ❌ Reporting success without running Step 4 verification.
