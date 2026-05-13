---
name: video-to-tagged-audio
description: 从视频链接下载音频并写入完整音乐标签（标题、艺术家、专辑、歌词等）。当用户提供视频链接并希望转为带元数据的 MP3 时触发。触发词包括"下载音乐"、"转MP3并加标签"、"下载歌曲"、"提取音频加歌词"、"download music with tags"、"add lyrics to mp3"。
---

# Video to Tagged Audio

从视频链接下载音频，搜索歌曲元数据和歌词，写入 MP3 ID3 标签，生成带时间轴和翻译的 LRC 歌词文件。

## 前置依赖

```bash
which yt-dlp || echo "需要安装: pip install yt-dlp"
which ffmpeg || echo "需要安装: brew install ffmpeg"
uv run --with mutagen python -c "import mutagen; print('mutagen OK')"
```

## 完整工作流

### Phase 1: 下载音频

```bash
yt-dlp -P "目标目录" -x --audio-format mp3 "VIDEO_URL"
```

- YouTube 链接加 `--cookies-from-browser chrome`
- 下载完成后确认文件路径和文件名

### Phase 2: 重命名

将下载的文件重命名为标准格式：

```
歌名 - 艺术家.mp3
```

从视频标题中提取歌名和艺术家信息。如果标题格式不明确，从视频页面或搜索结果中确认。

### Phase 3: 搜索元数据

使用 search-layer skill 搜索以下信息：

1. **基本信息**：标题、艺术家、专辑名、发行年份、流派、曲目编号
2. **歌词**：优先从 LRCLIB API 获取带时间轴的同步歌词

#### 3a. LRCLIB API 查询（优先）

```bash
# 精确匹配
curl -s "https://lrclib.net/api/search?track_name=TRACK&artist_name=ARTIST"

# 模糊搜索
curl -s "https://lrclib.net/api/search?q=QUERY"
```

返回结构中：
- `syncedLyrics`：带时间轴的 LRC 格式歌词
- `plainLyrics`：纯文本歌词
- `duration`：时长（秒），用于验证是否匹配

#### 3b. 网页搜索歌词（LRCLIB 无结果时）

搜索关键词：`"歌名" "艺术家" lyrics`

优先来源：
- letras.com / letras.mus.br
- utaten.com（日文歌）
- genius.com
- azlyrics.com

#### 3c. 搜索专辑信息

搜索关键词：`"歌名" "艺术家" album single release`

优先来源：
- last.fm（`https://www.last.fm/music/ARTIST`）
- TuneCore Japan（日文歌）
- Apple Music / Spotify 页面

### Phase 4: 写入 ID3 标签

使用 Python mutagen 库写入标签：

```bash
uv run --with mutagen python /tmp/write_tags.py
```

写入的标签字段：

| ID3 Frame | 含义 | 示例 |
|-----------|------|------|
| TIT2 | 标题 | NEVER DIE! |
| TPE1 | 艺术家 | Kocchi no Kento |
| TALB | 专辑 | NEVER DIE! |
| TDRC | 年份 | 2025 |
| TCON | 流派 | J-Pop |
| TRCK | 曲目编号 | 1 |
| USLT | 歌词（非同步） | 完整歌词文本 |
| COMM | 备注 | 补充说明 |

Python 模板：

```python
from mutagen.id3 import ID3, TIT2, TPE1, TALB, TDRC, TCON, USLT, TRCK, COMM

mp3_path = "目标文件.mp3"

tags = ID3()
tags.add(TIT2(encoding=3, text=["标题"]))
tags.add(TPE1(encoding=3, text=["艺术家"]))
tags.add(TALB(encoding=3, text=["专辑"]))
tags.add(TDRC(encoding=3, text=["年份"]))
tags.add(TCON(encoding=3, text=["流派"]))
tags.add(TRCK(encoding=3, text=["1"]))
tags.add(USLT(encoding=3, lang="eng", desc="", text=lyrics))
tags.add(COMM(encoding=3, lang="eng", desc="", text="备注"))
tags.save(mp3_path)
```

写入后验证：

```python
tags = ID3(mp3_path)
for key in ['TIT2', 'TPE1', 'TALB', 'TDRC', 'TCON', 'TRCK']:
    print(f"{key}: {tags.get(key)}")
```

### Phase 5: 生成 LRC 歌词文件

生成与 MP3 同名的 `.lrc` 文件，放在同一目录下。

#### LRC 文件格式

```
[ti:歌名]
[ar:艺术家]
[al:专辑]
[by:来源说明]
[00:00.00]作词 : 词作者
[00:01.00]作曲 : 曲作者
[00:18.22]原文歌词第一行
[00:18.22]翻译第一行
[00:20.16]原文歌词第二行
[00:20.16]翻译第二行
```

#### 翻译规则

- 每行原文歌词下方紧跟一行中文翻译，使用相同时间戳
- 翻译风格：准确传达含义，保持歌词的情感张力和节奏感
- 不逐字直译，优先传达语境和情绪
- 专有名词、感叹词、数字可保留原文
- 重复的副歌段落翻译保持一致

#### 时间轴来源优先级

1. LRCLIB `syncedLyrics` 字段（最准确）
2. 同一首歌的其他语言版本的时间轴（如日文原版 → 英文翻唱）
3. 无法获取时间轴时，生成不带时间戳的纯文本 LRC

### Phase 6: 清理

- 删除临时 Python 脚本
- 确认最终文件列表：
  - `歌名 - 艺术家.mp3`（带完整 ID3 标签）
  - `歌名 - 艺术家.lrc`（带时间轴和翻译）

## 输出确认

完成后列出：

```
文件：~/Downloads/歌名 - 艺术家.mp3
标签：标题 | 艺术家 | 专辑 | 年份 | 流派
歌词：~/Downloads/歌名 - 艺术家.lrc（XX行，含翻译）
```

## 注意事项

- 如果 LRCLIB 有精确匹配的同步歌词，优先使用，不要自行猜测时间轴
- 如果歌曲是翻唱/多语言版本，可以复用原版的时间轴（前提是曲子结构一致）
- 翻译质量优先于速度，宁可多花时间确认语境也不要机械直译
- 写入标签前先清除已有标签（`tags.delete()`），避免残留脏数据
- 临时脚本写入 `/tmp/` 并在完成后删除
