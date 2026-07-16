import os

with open('src/pages/Opportunities.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

out_lines = []
in_card = False
card_lines = []
map_return_idx = -1

for idx, line in enumerate(lines):
    if "import { useState, useEffect, useMemo, useRef } from 'react';" in line:
        line = "import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';\n"
    
    if "return (" in line and "opp-card" in lines[idx+2]:
        in_card = True
        map_return_idx = idx
        card_lines.append(line)
        continue
    
    if in_card:
        card_lines.append(line)
        # We know the card ends right before `          })} `
        if "          })}" in lines[idx+1]:
            in_card = False
            
            # Write new component
            component = """
const OppCard = React.memo(({ opp, isApplied, isApplying, onClick, onApply, setAppliedIds, showConfirm, api }) => {
""" + "".join(card_lines).replace("key={opp.id}", "").replace("onClick={() => setSelectedOpp(opp)}", "onClick={() => onClick(opp)}").replace("handleApply(opp.id)", "onApply(opp.id)") + """
});
"""
            out_lines.insert(0, component)
            
            # Write replacement for map body
            out_lines.append("""            return (
              <OppCard
                key={opp.id}
                opp={opp}
                isApplied={isApplied}
                isApplying={isApplying}
                onClick={setSelectedOpp}
                onApply={handleApply}
                setAppliedIds={setAppliedIds}
                showConfirm={showConfirm}
                api={api}
              />
            );
""")
    else:
        out_lines.append(line)

# Wait, placing OppCard at index 0 puts it before imports!
# Let's place it right before `const Opportunities = () => {`
real_out = []
for line in out_lines:
    if line.startswith("const OppCard ="):
        # Save it
        continue

# Find 'const Opportunities' index
opp_idx = 0
for i, l in enumerate(out_lines):
    if l.startswith("const Opportunities = () => {"):
        opp_idx = i
        break

final_lines = out_lines[:opp_idx] + [out_lines[0]] + out_lines[opp_idx:]

with open('src/pages/Opportunities.jsx', 'w', encoding='utf-8') as f:
    f.writelines(final_lines)
print("Success")
