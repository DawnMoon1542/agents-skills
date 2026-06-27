# LaTeX / KaTeX Rules for md2html

Use this document only when the source Markdown contains formulas or formula-like technical expressions.

`template.html` already includes KaTeX CSS, KaTeX JavaScript, auto-render, and display-formula overflow styling. Do not add KaTeX assets while generating an output HTML file. Inline formulas render with `\(...\)` to avoid treating currency values as math.

## 1. Detection

Treat the source as formula-bearing when it contains any of the following:

- Existing LaTeX delimiters: `$...$`, `$$...$$`, `\(...\)`, `\[...\]`
- Formula-like relations, such as `Need = Max - Allocation`
- Fractions, summations, inequalities, logarithms, probabilities, recurrence relations, matrix notation, address calculation formulas, performance formulas, or scheduling formulas

## 2. Formula Conversion

Preserve existing LaTeX formulas.

Convert clear plain-text formulas into LaTeX:

- `响应比=(等待时间+服务时间)/服务时间`
  → `\(响应比=\frac{等待时间+服务时间}{服务时间}\)`

- `Need = Max - Allocation`
  → `\(Need = Max - Allocation\)`

- `∑(Ci/Pi)≤1`
  → `\(\sum_{i=1}^{m}\frac{C_i}{P_i}\le 1\)`

Use inline math for short formulas inside prose:

```html
<p>响应比为 \(\frac{等待时间+服务时间}{服务时间}\)。</p>
```

Use display math for standalone formulas:

```html
<div>$$
Need = Max - Allocation
$$</div>
```

Do not place formulas inside `<code>`, `<pre>`, Mermaid blocks, headings, `alt` text, or HTML attributes unless the source is explicitly showing formula source code.

## 3. HTML Writing Rules

- Keep formulas as semantic text.
- Do not convert formulas to images, SVG drawings, screenshots, or vague prose.
- Keep variable names, subscripts, superscripts, fractions, sums, inequalities, and units in valid LaTeX syntax.
- Escape comparison operators outside math only when required by HTML context.
- Inside LaTeX delimiters, keep LaTeX syntax unchanged.
- Use `<div>$$...$$</div>` for standalone display formulas so KaTeX has block context.
- Use paragraph text with `\(...\)` for inline formulas.
- Normalize existing inline `$...$` source formulas to `\(...\)` unless the source is explicitly discussing delimiter syntax.

## 4. Code and Formula Boundaries

Use code blocks for source code, shell commands, config, or literal formula source that the document is discussing as code.

```html
<pre><code class="language-ts">const utilization = executionTime / period;
if (utilization &lt;= 1) {
  schedule(task);
}</code></pre>
```

Use LaTeX delimiters for mathematical notation that should render visually:

```html
<p>CPU utilization is \(U = \sum_{i=1}^{n}\frac{C_i}{T_i}\).</p>
```

Do not wrap renderable formulas in `<code>` just because the source Markdown used backticks casually. Choose formula markup when the content is mathematical notation.

## 5. Verification

Before reporting completion:

- Formula delimiters must be balanced: `$$...$$`, `\(...\)`, and `\[...\]`.
- Inline renderable formulas must use `\(...\)`, not `$...$`.
- Formulas must not be inside `<pre><code>`, Mermaid blocks, headings, or HTML attributes unless they are source code.
- The generated output must not add KaTeX `<link>` or `<script>` tags; those belong to `template.html`.
- Placeholder checks must search for template placeholders such as `{{TITLE}}`; LaTeX braces such as `\frac{a}{b}` are valid syntax and must not be treated as placeholder residue.
