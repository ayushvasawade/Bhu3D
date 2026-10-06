import time
import os
import sys
from playwright.sync_api import sync_playwright

def audit_deployed_site():
    out_dir = r"C:\Users\vasaw\.gemini\antigravity-ide\brain\c9a9cb5c-da94-428c-b722-7e224f9ba06b"
    os.makedirs(out_dir, exist_ok=True)
    
    console_messages = []
    console_errors = []
    failed_requests = []
    
    url = "https://bhu3-d.vercel.app/"
    print(f"==================================================")
    print(f"AUDITING DEPLOYED SITE: {url}")
    print(f"==================================================")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1600, "height": 1000})
        page = context.new_page()

        page.on("console", lambda msg: (
            console_errors.append(f"[{msg.type.upper()}] {msg.text}") if msg.type in ["error"]
            else console_messages.append(f"[{msg.type.upper()}] {msg.text}")
        ))
        page.on("pageerror", lambda err: console_errors.append(f"[UNCAUGHT] {str(err)}"))
        page.on("requestfailed", lambda req: failed_requests.append(f"[FAILED REQ] {req.url} -> {req.failure}"))
        page.on("response", lambda resp: (
            failed_requests.append(f"[HTTP {resp.status}] {resp.url}") if resp.status >= 400 else None
        ))

        print(f"1. Loading page {url}...")
        t0 = time.time()
        try:
            page.goto(url, wait_until="networkidle", timeout=60000)
        except Exception as e:
            print(f"Page goto note: {e}")
        
        load_time = time.time() - t0
        print(f"   Page initial load completed in {load_time:.2f}s")
        time.sleep(4)
        
        page.screenshot(path=os.path.join(out_dir, "audit_1_home.png"))
        print(f"   Captured audit_1_home.png")

        # 2. Check title & headers
        title = page.title()
        print(f"   Page Title: {title}")

        # 3. Check Cesium Canvas
        canvas = page.locator("canvas")
        canvas_count = canvas.count()
        print(f"   Cesium Canvas elements found: {canvas_count}")

        # 4. Check Fly to DTLA 3D Construction if button exists
        dtla_btn = page.locator("button:has-text('DTLA 3D Construction'), button:has-text('Downtown LA (Active 3D)')")
        if dtla_btn.count() > 0:
            print(f"   Found DTLA jump button, clicking...")
            dtla_btn.first.click()
            time.sleep(4)
            page.screenshot(path=os.path.join(out_dir, "audit_2_dtla_precinct.png"))
            print(f"   Captured audit_2_dtla_precinct.png")
        else:
            print(f"   DTLA jump button not directly visible on landing screen")

        # 5. Check Building Selector
        bld_select = page.locator("select")
        print(f"   Select dropdown elements: {bld_select.count()}")
        if bld_select.count() > 0:
            opts = bld_select.first.locator("option").all()
            print(f"   Building options count: {len(opts)}")
            if len(opts) > 1:
                # Select second option (first real building)
                val = opts[1].get_attribute("value")
                txt = opts[1].inner_text()
                print(f"   Selecting building: {txt} (val: {val})")
                bld_select.first.select_option(val)
                time.sleep(3)
                page.screenshot(path=os.path.join(out_dir, "audit_3_building_selected.png"))
                print(f"   Captured audit_3_building_selected.png")

        # 6. Check for Building Card or Property Passport button
        passport_btn = page.locator("button:has-text('Property Passport'), button:has-text('Full Passport'), a:has-text('Full Passport')")
        if passport_btn.count() > 0:
            print(f"   Found Passport button, clicking...")
            passport_btn.first.click()
            time.sleep(3)
            page.screenshot(path=os.path.join(out_dir, "audit_4_property_passport.png"))
            print(f"   Captured audit_4_property_passport.png")
        
        # 7. Check for Floor Inspector
        floor_btn = page.locator("button:has-text('Floor Slices'), button:has-text('Floor')")
        print(f"   Floor related buttons found: {floor_btn.count()}")

        # 8. Check for Underground panel
        ug_btn = page.locator("button:has-text('Inspect Panel'), button:has-text('Explore Underground')")
        if ug_btn.count() > 0:
            print(f"   Found Underground button, clicking...")
            ug_btn.first.click()
            time.sleep(3)
            page.screenshot(path=os.path.join(out_dir, "audit_5_underground_panel.png"))
            print(f"   Captured audit_5_underground_panel.png")

        browser.close()

    print("\n==================================================")
    print("DEPLOYMENT CONSOLE & NETWORK AUDIT RESULTS:")
    print("==================================================")
    print(f"Console Messages: {len(console_messages)}")
    print(f"Console Errors:   {len(console_errors)}")
    for err in console_errors[:10]:
        print(f"  ! {err}")
    
    print(f"Failed / 4xx / 5xx Network Requests: {len(failed_requests)}")
    for req in failed_requests[:10]:
        print(f"  * {req}")
    print("==================================================")

if __name__ == "__main__":
    audit_deployed_site()
