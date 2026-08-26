// Radio Generation
import { radioApi } from "@/lib/api/client";

export async function generateRadio(seedTrack: any, limit = 20) {
  try {
    const response = await radioApi.start(seedTrack);
    return response.tracks || [];
  } catch (error) {
    console.error("Radio generation failed:", error);
    return [];
  }
}

export async function getRadioMore(cursor: string) {
  try {
    const response = await radioApi.more(cursor);
    return response.tracks || [];
  } catch (error) {
    console.error("Radio pagination failed:", error);
    return [];
  }
}