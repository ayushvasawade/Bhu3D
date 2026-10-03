import time
import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1500, "height": 950})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        print("Navigating to http://localhost:5173...")
        page.goto("http://localhost:5173", wait_until="networkidle", timeout=45000)
        time.sleep(5)

        out_dir = r"C:\Users\vasaw\.gemini\antigravity-ide\brain\6f797353-4a04-4bf4-b6aa-a6aa9cf63168"
        os.makedirs(out_dir, exist_ok=True)

        # 1. Initial view: Reconstructed 3D Buildings in Los Angeles
        page.screenshot(path=f"{out_dir}\\la_1_reconstructed_mesh.png")
        print("Captured la_1_reconstructed_mesh.png")

        # 2. Toggle to Point Cloud (SCAN)
        scan_btn = page.locator("button:has-text('SCAN')")
        if scan_btn.count() > 0:
            scan_btn.first.click()
            time.sleep(3)
            page.screenshot(path=f"{out_dir}\\la_2_point_cloud.png")
            print("Captured la_2_point_cloud.png")
        else:
            print("SCAN button not found")

        # 3. Toggle to COMPARE (Both Point Cloud & 3D Reconstructed Mesh)
        compare_btn = page.locator("button:has-text('COMPARE')")
        if compare_btn.count() > 0:
            compare_btn.first.click()
            time.sleep(3)
            page.screenshot(path=f"{out_dir}\\la_3_compare.png")
            print("Captured la_3_compare.png")
        else:
            print("COMPARE button not found")

        # 4. Select a building from the dropdown (e.g. Public Works Building)
        bld_select = page.locator("select:has(option:has-text('Public Works'))")
        if bld_select.count() > 0:
            # Select the option that has 'Public Works'
            options = bld_select.locator("option").all()
            for opt in options:
                txt = opt.inner_text()
                if "Public Works" in txt:
                    val = opt.get_attribute("value")
                    bld_select.select_option(val)
                    print(f"Selected building option: {txt}")
                    break
            time.sleep(3)
            page.screenshot(path=f"{out_dir}\\la_4_building_selected.png")
            print("Captured la_4_building_selected.png")

            # 5. Click on an inferred floor slice button in LABuildingCard
            floor_btn = page.locator("button:has-text('Level 04')")
            if floor_btn.count() == 0:
                floor_btn = page.locator("button:has-text('Level 4')")
            if floor_btn.count() > 0:
                floor_btn.first.click()
                time.sleep(2)
                page.screenshot(path=f"{out_dir}\\la_5_floor_slice_highlighted.png")
                print("Captured la_5_floor_slice_highlighted.png")
            else:
                print("Level 04 button not found in LABuildingCard")

        # 6. Switch dataset back to Utah State Capitol
        dataset_select = page.locator("select:has(option:has-text('Utah State Capitol'))")
        if dataset_select.count() > 0:
            dataset_select.select_option("utah_capitol")
            time.sleep(3)
            page.screenshot(path=f"{out_dir}\\la_6_utah_switch.png")
            print("Captured la_6_utah_switch.png")

        print("Total console errors:", len(console_errors))
        for err in console_errors[:15]:
            print("  [Console Error]:", err)

        browser.close()

if __name__ == "__main__":
    run()
