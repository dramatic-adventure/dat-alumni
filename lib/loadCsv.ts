const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzkIPStlL2TU7AHySD3Kw9CqBFTi1q6QW7N99ivE3FpofNhHlwWejU0LXeMOmnTawtmLCT71KWMU-F/pub?output=csv";

export async function loadCsv(): Promise<string> {
  try {
    const response = await fetch(CSV_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error("❌ loadCsv error:", error);
    throw error;
  }
}
