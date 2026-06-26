# LaTeX / KaTeX Rules for md2html

Use this document only when the source Markdown contains formulas or formula-like technical expressions.

## 1. Detection

Treat the source as formula-bearing when it contains any of the following:

- Existing LaTeX delimiters: `$...$`, `$$...$$`, `\(...\)`, `\[...\]`
- Formula-like relations, such as `Need = Max - Allocation`
- Fractions, summations, inequalities, logarithms, probabilities, recurrence relations, matrix notation, address calculation formulas, performance formulas, or scheduling formulas

## 2. Formula Conversion

Preserve existing LaTeX formulas.

Convert clear plain-text formulas into LaTeX:

- `响应比=(等待时间+服务时间)/服务时间`
  → `$响应比=\frac{等待时间+服务时间}{服务时间}$`

- `Need = Max - Allocation`
  → `$Need = Max - Allocation$`

- `∑(Ci/Pi)≤1`
  → `$\sum_{i=1}^{m}\frac{C_i}{P_i}\le 1$`

Use inline math for short formulas inside prose:

```html
<p>响应比为 $\frac{等待时间+服务时间}{服务时间}$。</p>
```

Use display math for standalone formulas:

```html
<div>$$
Need = Max - Allocation
$$</div>
```

Do not place formulas inside `<code>`, `<pre>`, Mermaid blocks, headings, `alt` text, or HTML attributes unless the source is explicitly showing formula source code.

## 3. KaTeX Injection

When formulas exist, inject KaTeX assets into the generated HTML head.

Add this CSS before `</style>`:

```html
.katex-display { margin: 12px 0; overflow-x: auto; overflow-y: hidden; }
.katex { font-size: 1.05em; }
```

Add these assets after `</style>` and before `</head>`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}]})"></script>
```

This is the only allowed exception to the “no extra scripts beyond template” rule, and only applies when formulas are present.

## 4. HTML Writing Rules

- Keep formulas as semantic text.
- Do not convert formulas to images, SVG drawings, screenshots, or vague prose.
- Keep variable names, subscripts, superscripts, fractions, sums, inequalities, and units in valid LaTeX syntax.
- Escape comparison operators outside math only when required by HTML context.
- Inside LaTeX delimiters, keep LaTeX syntax unchanged.

## 5. Verification

Before reporting completion:

- KaTeX CSS and scripts must appear exactly once when formulas exist.
- Formula delimiters must be balanced: `$...$`, `$$...$$`, `\(...\)`, and `\[...\]`.
- Formulas must not be inside `<pre><code>`, Mermaid blocks, headings, or HTML attributes unless they are source code.
- Placeholder checks must search for template placeholders such as `{{TITLE}}`; LaTeX braces such as `\frac{a}{b}` are valid syntax and must not be treated as placeholder residue.
