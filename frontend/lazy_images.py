import os, re

count = 0
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            fpath = os.path.join(root, file)
            with open(fpath, 'r', encoding='utf-8') as f:
                code = f.read()
            
            def replacer(match):
                tag = match.group(0)
                if 'loading="lazy"' not in tag:
                    return tag.replace('<img ', '<img loading="lazy" decoding="async" ')
                return tag

            new_code = re.sub(r'<img [^>]*>', replacer, code)
            
            if new_code != code:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(new_code)
                count += 1

print(f'Updated images in {count} files')
