import os
import re

directories_to_search = ["src"]
regex = re.compile(r'NAIL\s*<span[^>]*>OX</span>', re.IGNORECASE)
replacement = '<img src="/assets/caluatnails-logo.png" alt="Caluatnails" className="h-8 md:h-10 w-auto object-contain" />'

for root, _, files in os.walk("src"):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content, count = regex.subn(replacement, content)
            if count > 0:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}: replaced {count} instances.")
print("Done.")
