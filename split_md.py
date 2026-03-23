import os
import re

input_file = r"c:\Users\rukat\Downloads\ドローン資格　教則\ドローン２等資格　教則(ブログ風).md"
out_dir = r"c:\Users\rukat\Downloads\ドローン資格　教則\drone-license-docs\src\content\docs\guides"

os.makedirs(out_dir, exist_ok=True)

with open(input_file, 'r', encoding='utf-8') as f:
    text = f.read()

# Split by "## " (Level 2 heading)
parts = re.split(r'^(## .+)$', text, flags=re.MULTILINE)

intro = parts[0] # Anything before the first "## "

chapters = []
for i in range(1, len(parts), 2):
    title_line = parts[i]
    content = parts[i+1]
    
    title = title_line.replace('## ', '').strip()
    # Match something like "1. はじめに" and extract the number to use in filename
    m = re.match(r'^(\d+)\.\s*(.*)', title)
    if m:
        chap_num = m.group(1)
        filename = f"chapter{chap_num}.md"
    else:
        # Fallback if no number
        chap_num = len(chapters) + 1
        filename = f"chapter{chap_num}.md"
    
    chapters.append((filename, title, content))

for filename, title, content in chapters:
    out_path = os.path.join(out_dir, filename)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(f"---\n")
        f.write(f"title: \"{title}\"\n")
        f.write(f"---\n\n")
        f.write(content.strip() + "\n")

print(f"Created {len(chapters)} chapter files in {out_dir}")
