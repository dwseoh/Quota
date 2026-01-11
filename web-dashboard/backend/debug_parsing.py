
import re
import json
import traceback

# Simulation of the logic I added to chat.py
def test_parsing():
    print("Testing parsing logic...")
    response_text = """
Here is the scope analysis summary:
- Users: 1000
- Traffic: 3/5

```json
{
  "scope_analysis": {
    "users": 1000,
    "trafficLevel": 3,
    "dataVolumeGB": 100,
    "regions": 2,
    "availability": 99.9,
    "estimatedCost": 500
  }
}
```
"""
    updated_scope = None
    try:
        # Look for JSON block with scope_analysis
        json_match = re.search(r"```json\s*(\{.*?\})\s*```", response_text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(1))
            if "scope_analysis" in data:
                analysis = data["scope_analysis"]
                updated_scope = {
                    "users": analysis.get("users"),
                    "trafficLevel": analysis.get("trafficLevel"),
                    "dataVolumeGB": analysis.get("dataVolumeGB"),
                    "regions": analysis.get("regions"),
                    "availability": analysis.get("availability")
                }
                updated_scope = {k: v for k, v in updated_scope.items() if v is not None}
                print(f"📊 Detected scope update: {updated_scope}")
                
                # Remove the JSON block from the visible response
                response_text = response_text.replace(json_match.group(0), "").strip()
                print("✅ Cleaned Response text:", response_text)
                
    except Exception as e:
        print("Test Failed with Exception:")
        traceback.print_exc()

if __name__ == "__main__":
    test_parsing()
