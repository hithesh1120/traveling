"""Fix corrupted template literals in frontend files.
Replace patterns like: `${ API_BASE_URL } / deliveries / ${ id } / start - unloading`
With correct: `${API_BASE_URL}/deliveries/${id}/start-unloading`
"""
import os
import re
import glob

src_dir = r"c:\Users\hithe\Downloads\New folder\Logistics\frontend\src"

patterns = [os.path.join(src_dir, "**", "*.jsx"), os.path.join(src_dir, "**", "*.js")]
files = []
for p in patterns:
    files.extend(glob.glob(p, recursive=True))

files = [f for f in files if not f.endswith("apiConfig.js")]

# Specific replacements for known corrupted template literals
replacements = {
    # WarehouseDashboard
    "`${ API_BASE_URL } / deliveries / ${ id } / start - unloading`": "`${API_BASE_URL}/deliveries/${id}/start-unloading`",
    # VendorDeliveries
    "`${ API_BASE_URL } / deliveries / ${ id } / submit`": "`${API_BASE_URL}/deliveries/${id}/submit`",
    # GateDashboard
    "`${ API_BASE_URL } / deliveries / ${ id } / gate - in`": "`${API_BASE_URL}/deliveries/${id}/gate-in`",
    "`${ API_BASE_URL } / deliveries / ${ id } / gate - out`": "`${API_BASE_URL}/deliveries/${id}/gate-out`",
    # DockScheduling
    "`${ API_BASE_URL } / deliveries / ${ delivery.id } / schedule`": "`${API_BASE_URL}/deliveries/${delivery.id}/schedule`",
    # DeliveryManagement
    "`${ API_BASE_URL } / deliveries / ${ id } / approve`": "`${API_BASE_URL}/deliveries/${id}/approve`",
    "`${ API_BASE_URL } / deliveries / ${ id }`": "`${API_BASE_URL}/deliveries/${id}`",
    # ReceiveDeliveryModal
    "`${ API_BASE_URL } / deliveries / ${ delivery.id } / receive`": "`${API_BASE_URL}/deliveries/${delivery.id}/receive`",
    # EditDeliveryModal
    "`${ API_BASE_URL } / deliveries / ${ delivery.id }`": "`${API_BASE_URL}/deliveries/${delivery.id}`",
    # CreateDeliveryModal
    "`${ API_BASE_URL } / deliveries / ${ deliveryId } / upload`": "`${API_BASE_URL}/deliveries/${deliveryId}/upload`",
}

for filepath in files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    original = content
    
    for old, new in replacements.items():
        content = content.replace(old, new)
    
    # Generic fix: collapse spaces in template literals with API_BASE_URL
    # Pattern: `${ API_BASE_URL } / ... 
    # Fix by removing extra spaces inside ${ } and around /
    def fix_template(match):
        s = match.group(0)
        # Remove spaces inside ${ ... }
        s = re.sub(r'\$\{\s+', '${', s)
        s = re.sub(r'\s+\}', '}', s)
        # Remove spaces around /
        s = re.sub(r'\s*/\s*', '/', s)
        # Fix common word-space patterns like "start - unloading" -> "start-unloading"  
        s = re.sub(r'(\w)\s+-\s+(\w)', r'\1-\2', s)
        return s
    
    content = re.sub(r'`\$\{[^`]*API_BASE_URL[^`]*`', fix_template, content)
    
    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed: {os.path.basename(filepath)}")

print("Done!")
