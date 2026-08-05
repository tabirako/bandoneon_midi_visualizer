import csv
import re
import json

CSV_FILE = "data142.csv"
JS_FILE = "mappings.js"

# Load CSV: id, x, y
new_positions = {}
with open(CSV_FILE, newline="") as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        id_str, x_str, y_str = row
        new_positions[int(id_str)] = (float(x_str), float(y_str))

# Load mappings.js
with open(JS_FILE, "r", encoding="utf8") as f:
    js = f.read()

# Extract the "142": [[ ... ]] block
pattern = r'"142"\s*:\s*\[\s*\{(.*?)\}\s*\]'
match = re.search(pattern, js, flags=re.S)
if not match:
    raise Exception("Could not find the '142' block in mappings.js")

block_text = match.group(1)

# Parse the block as JSON array
block_json = "[" + block_text + "]"
buttons = json.loads(block_json)

# Update x,y for matching ids
for btn in buttons:
    btn_id = btn.get("id")
    if btn_id in new_positions:
        x, y = new_positions[btn_id]
        btn["x"] = x
        btn["y"] = y

# Convert updated block back to JS
new_block = json.dumps(buttons, indent=2)

# Replace only the inside of "142": [[ ... ]]
updated_js = (
    js[:match.start(1)]
    + new_block
    + js[match.end(1):]
)

# Write back
with open(JS_FILE, "w", encoding="utf8") as f:
    f.write(updated_js)

print("Updated x,y for", len(new_positions), "buttons in '142'.")
