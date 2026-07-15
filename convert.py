import re

def emoji_to_code(match):
    emoji = match.group(1)
    if len(emoji) >= 2:
        # Assuming true unicode string (len == 2 for a flag)
        c1 = chr(ord(emoji[0]) - 0x1F1E6 + ord('a'))
        c2 = chr(ord(emoji[1]) - 0x1F1E6 + ord('a'))
        return f'code: "{c1}{c2}"'
    return match.group(0)

with open('js/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'bandera:\s*"([^"]+)"', emoji_to_code, content)

with open('js/data.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
