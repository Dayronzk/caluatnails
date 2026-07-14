import os

replacements = [
    ("NAILOX", "CALUATNAILS"),
    ("Nailox", "Caluatnails"),
    ("nailox", "caluatnails")
]

directories = ["src", "public", "supabase"]
files_to_check = ["index.html", "package.json", "vite.config.ts", "middleware.ts", "vercel.json"]

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
        pass

for f in files_to_check:
    if os.path.exists(f):
        process_file(f)
print("Replacement done.")
