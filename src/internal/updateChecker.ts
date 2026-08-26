// Update Checker
interface UpdateInfo {
  version: string;
  notes: string;
  date: string;
  url: string;
}

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    // Check GitHub releases for updates
    const response = await fetch("https://api.github.com/repos/Pant0x/Amber-Music-Platform/releases/latest");
    if (!response.ok) return null;

    const release = await response.json();
    const currentVersion = "1.0.0"; // Would be injected at build time

    if (compareVersions(release.tag_name, currentVersion) > 0) {
      return {
        version: release.tag_name,
        notes: release.body || "",
        date: release.published_at,
        url: release.html_url,
      };
    }
  } catch (error) {
    console.error("Update check failed:", error);
  }
  return null;
}

export function isUpdateSnoozed(): boolean {
  const snoozed = localStorage.getItem("update-snoozed");
  if (!snoozed) return false;
  const { version, timestamp } = JSON.parse(snoozed);
  // Snooze for 7 days
  return Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000 && version === "1.0.0";
}

function compareVersions(a: string, b: string): number {
  const aParts = a.replace("v", "").split(".").map(Number);
  const bParts = b.replace("v", "").split(".").map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }
  return 0;
}