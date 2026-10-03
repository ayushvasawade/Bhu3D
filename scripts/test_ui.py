import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        print("Navigating to http://localhost:5173...")
        page.goto("http://localhost:5173", wait_until="networkidle", timeout=30000)
        time.sleep(4)

        # 1. Capture initial view
        out_dir = r"C:\Users\vasaw\.gemini\antigravity-ide\brain\6f797353-4a04-4bf4-b6aa-a6aa9cf63168"
        page.screenshot(path=f"{out_dir}\\test_1_reconstruction.png")
        print("Captured test_1_reconstruction.png")

        # 2. Click [ REAL LiDAR SCAN ]
        scan_btn = page.locator("button:has-text('REAL LiDAR SCAN')")
        if scan_btn.count() > 0:
            scan_btn.first.click()
            time.sleep(3)
            page.screenshot(path=f"{out_dir}\\test_2_real_scan.png")
            print("Captured test_2_real_scan.png")
        else:
            print("REAL LiDAR SCAN button not found via text")

        # 3. Click [ COMPARE ]
        compare_btn = page.locator("button:has-text('COMPARE')")
        if compare_btn.count() > 0:
            compare_btn.first.click()
            time.sleep(2)
            page.screenshot(path=f"{out_dir}\\test_3_compare.png")
            print("Captured test_3_compare.png")

        # 4. Click "Open Side-by-Side Inspector"
        side_by_side_btn = page.locator("button:has-text('Open Side-by-Side Inspector')")
        if side_by_side_btn.count() > 0:
            side_by_side_btn.first.click()
            time.sleep(3)
            page.screenshot(path=f"{out_dir}\\test_4_side_by_side_modal.png")
            print("Captured test_4_side_by_side_modal.png")
            # Close modal via escape key
            page.keyboard.press("Escape")
            time.sleep(1)

        # 5. Click [ INSPECTOR & QC ]
        inspector_btn = page.locator("button:has-text('INSPECTOR & QC')")
        if inspector_btn.count() > 0:
            inspector_btn.first.click()
            time.sleep(4)
            page.screenshot(path=f"{out_dir}\\test_5_mesh_inspector.png")
            print("Captured test_5_mesh_inspector.png")

            # Click East-West profile switch
            east_cut_btn = page.locator("button:has-text('East Side Cut (68m)')")
            if east_cut_btn.count() > 0:
                east_cut_btn.first.click()
                time.sleep(2)
                page.screenshot(path=f"{out_dir}\\test_6_east_profile.png")
                print("Captured test_6_east_profile.png")
            else:
                print("East Side Cut button not found")
                print("Captured test_6_east_profile.png")
        else:
            print("INSPECTOR & QC button not found via text")

        print("Console errors count:", len(console_errors))
        for err in console_errors[:10]:
            print("  ERR:", err)

        browser.close()

if __name__ == "__main__":
    run()
