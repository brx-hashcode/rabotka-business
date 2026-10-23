/**
 * Copies text, and says whether it worked. `navigator.clipboard` only exists
 * on secure pages (https, localhost), so a phone opening the dev server at
 * http://192.168.x.x falls back to a hidden textarea and `execCommand`.
 * Call it straight from the click: browsers only allow copying during one.
 */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission refused: try the fallback below.
    }
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.readOnly = true;
  // 16px so iOS does not zoom on the selection; off-screen so nothing shows.
  area.style.cssText = "position:fixed;top:0;left:-9999px;font-size:16px;opacity:0";
  document.body.append(area);
  try {
    area.select();
    area.setSelectionRange(0, text.length); // iOS ignores select() alone
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}
