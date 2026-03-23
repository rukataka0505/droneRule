import re
import sys

def process_file(in_path, out_path):
    with open(in_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    out_lines = []
    buffer_line = ""
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Remove page numbers
        if re.match(r'^[\divxlcm]+$', line):
            continue
        if "（空白頁）" in line:
            continue
            
        # Detect headings
        h_match_1 = re.match(r'^(\d+\.)\s+(.+)$', line)
        h_match_2 = re.match(r'^(\d+\.\d+(?:\.\d+)?)\s+(.+)$', line)
        h_match_3 = re.match(r'^■|●|◆', line)
        
        # Detect lists
        l_match = re.match(r'^(（\d+）|\(\d+\)|[①-⑳]|[a-z]\.|[A-Z]\.)\s*(.+)$', line)
        
        # Is it a title/heading?
        if h_match_2:
            if buffer_line: out_lines.append(buffer_line); buffer_line = ""
            out_lines.append(f"\n### {line}\n")
            continue
        elif h_match_1:
            if buffer_line: out_lines.append(buffer_line); buffer_line = ""
            out_lines.append(f"\n## {line}\n")
            continue
        elif h_match_3:
            if buffer_line: out_lines.append(buffer_line); buffer_line = ""
            out_lines.append(f"\n#### {line}\n")
            continue
            
        # List start?
        if l_match:
            if buffer_line: out_lines.append(buffer_line); buffer_line = ""
            out_lines.append(f"\n- {line}")
            continue
            
        # Determine if we should join
        if buffer_line:
            if buffer_line.endswith('。') or buffer_line.endswith('！') or buffer_line.endswith('？') or buffer_line.endswith('．'):
                out_lines.append(buffer_line)
                out_lines.append("") # empty line between paragraphs
                buffer_line = line
            else:
                buffer_line += line
        else:
            buffer_line = line

    if buffer_line:
        out_lines.append(buffer_line)
        
    # Bold formatting
    full_text = "\n".join(out_lines)
    
    # regex for law and specific emphasis
    # e.g., 航空法, 民法
    full_text = re.sub(r'([^（、。\n]法)', r'**\1**', full_text)
    
    # Bolding penalties
    full_text = re.sub(r'(懲役|罰金|万円以下の罰金|取消し|停止|過料|業務上過失致死傷)', r'**\1**', full_text)
    
    # Terms
    terms = ["無人航空機", "特定飛行", "機体認証", "技能証明", "立入管理措置", "カテゴリーⅠ飛行", "カテゴリーⅡ飛行", "カテゴリーⅢ飛行", "レベル１", "レベル２", "レベル３", "レベル４"]
    for term in terms:
        full_text = full_text.replace(term, f"**{term}**")
        
    # Avoid double bolding
    full_text = full_text.replace("****", "**")
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(full_text)

if __name__ == "__main__":
    process_file(sys.argv[1], sys.argv[2])
