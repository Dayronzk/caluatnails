import os

replacements = [
    ("NAILOX", "CALUATNAILS"),
    ("Nailox", "Caluatnails"),
    ("nailox", "caluatnails")
]

directories = ["src", "public", "supabase"]
files_to_check = ["index.html", "package.json", "vite.config.ts"]

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for old, new in replacements:
            new_content = new_content.replace(old, new)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
    except Exception as e:
        # Ignore binary files or read errors
        pass

for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            process_file(os.path.join(root, file))

for f in files_to_check:
    if os.path.exists(f):
        process_file(f)
        
print("Replacement completed.")
