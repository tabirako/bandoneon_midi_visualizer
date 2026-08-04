import csv
import json

CSV_FILE = "data.csv"
JS_FILE = "mappings.js"

# Read CSV
entries = []
with open(CSV_FILE, newline="") as f:
    reader = csv.reader(f)
    header = next(reader)  # skip header
    for row in reader:
        name, x, y = row
        entries.append({
            "name": name,
            "x": float(x),
            "y": float(y)
        })

# Convert to JS format
js_content = "export const mappings = " + json.dumps(entries, indent=2) + ";\n"

# Overwrite mappings.js
with open(JS_FILE, "w") as f:
    f.write(js_content)

print(f"Wrote {len(entries)} entries to {JS_FILE}")
