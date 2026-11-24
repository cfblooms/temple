"""重新產生 public/fonts/（自架字型，只含遊戲裡用到的字）。

新增文案、用到新的中文字之後跑一次：
    pip install fonttools brotli
    python3 scripts/build-fonts.py
沒包進來的字會先用系統字型顯示（不會變成方塊），所以忘了跑也不會壞。

做法：從 Google Fonts 抓 Huninn、Noto Serif TC 600/900 的完整 TTF，統計 src/ 和 index.html 裡每個字出現的次數，
依常用程度切成 4 包（最常用的 300 字＋英數一包），每包用 unicode-range 宣告，瀏覽器只抓畫面上用得到的那幾包。
"""
import collections, glob, json, os, pathlib, re, subprocess, tempfile, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'fonts'
FONTS = [('huninn', 'Huninn', 400), ('serif600', 'Noto Serif TC', 600), ('serif900', 'Noto Serif TC', 900)]
CUTS = [0, 300, 700, 1300]

def ttf_urls():
    css = urllib.request.urlopen('https://fonts.googleapis.com/css2?family=Huninn&family=Noto+Serif+TC:wght@600;900').read().decode()
    return re.findall(r'url\((https://[^)]+\.ttf)\)', css)  # 順序：Huninn, Serif 600, Serif 900

def ranges(chars):
    cps = sorted({ord(c) for c in chars}); out = []; a = b = cps[0]
    for c in cps[1:]:
        if c == b + 1: b = c
        else: out.append((a, b)); a = b = c
    out.append((a, b))
    return ','.join(f'U+{x:X}' if x == y else f'U+{x:X}-{y:X}' for x, y in out)

def main():
    text = ''
    for f in glob.glob(str(ROOT / 'src' / '**' / '*.js'), recursive=True) + [str(ROOT / 'index.html'), str(ROOT / 'src' / 'style.css')]:
        text += open(f, encoding='utf-8').read()
    order = [c for c, _ in collections.Counter(ch for ch in text if ord(ch) > 0x7f).most_common()]
    cuts = CUTS + [len(order)]
    slices = [order[cuts[i]:cuts[i + 1]] for i in range(len(CUTS))]
    ascii_ = ''.join(chr(i) for i in range(0x20, 0x7f))
    OUT.mkdir(parents=True, exist_ok=True)
    css = []
    with tempfile.TemporaryDirectory() as tmp:
        for (name, fam, w), url in zip(FONTS, ttf_urls()):
            ttf = os.path.join(tmp, name + '.ttf'); urllib.request.urlretrieve(url, ttf)
            for i, chars in enumerate(slices):
                txt = ''.join(chars) + (ascii_ if i == 0 else '')
                tf = os.path.join(tmp, 't.txt'); open(tf, 'w', encoding='utf-8').write(txt)
                subprocess.run(['pyftsubset', ttf, f'--text-file={tf}', '--flavor=woff2', '--layout-features=*', f'--output-file={OUT / f"{name}-{i}.woff2"}'], check=True)
                css.append(f"@font-face{{font-family:'{fam}';font-weight:{w};font-display:swap;src:url(/fonts/{name}-{i}.woff2) format('woff2');unicode-range:{ranges(txt)}}}")
    (OUT / 'fonts.css').write_text('\n'.join(css), encoding='utf-8')
    print(f'{len(order)} 個字，{len(css)} 個字型檔')

if __name__ == '__main__':
    main()
