import path from "node:path";

export interface BirthDataInput {
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface EngineInput {
  birth_data?: BirthDataInput;
  current_time?: string;
  location?: { latitude: number; longitude: number };
  options?: Record<string, unknown>;
  precision?: string;
}

// Minimal hardcoded geo fallback for the smoke-test location.
// Real callers should eventually supply lat/long via options or .selemenerc.json.
const LOCATION_COORDINATES: Record<string, { latitude: number; longitude: number; timezone: string }> =
  {
    london: { latitude: 51.5074, longitude: -0.1278, timezone: "Europe/London" },
  };

function parseIsoDatetime(datetime: string): { date: string; time: string; timezone: string } | null {
  const m = datetime.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/
  );
  if (!m) return null;
  const [, year, month, day, hour, minute, , tz] = m;
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}`, timezone: tz };
}

function normalizeLocation(location: string): {
  latitude?: number;
  longitude?: number;
  timezone?: string;
} {
  const key = location.toLowerCase().trim();
  return LOCATION_COORDINATES[key] ?? {};
}

export function buildBirthData(
  name: string,
  datetime: string,
  location: string
): BirthDataInput {
  const parsed = parseIsoDatetime(datetime);
  const geo = normalizeLocation(location);
  return {
    name,
    date: parsed?.date ?? datetime.split("T")[0] ?? "",
    time: parsed?.time ?? "12:00",
    latitude: geo.latitude,
    longitude: geo.longitude,
    timezone: geo.timezone ?? parsed?.timezone ?? "UTC",
  };
}

export function deterministicWorkflowId(type: "birth" | "compatibility" | "transit"): string {
  switch (type) {
    case "birth":
      return "birth-blueprint";
    case "compatibility":
      // Full spectrum is the only workflow that runs all engines and can carry dyadic context in options.
      return "full-spectrum";
    case "transit":
      // Daily practice includes biorhythm + transits engines and respects current_time.
      return "daily-practice";
  }
}

export function buildDeterministicEngineInput(
  type: "birth" | "compatibility" | "transit",
  args: {
    name?: string;
    datetime?: string;
    location?: string;
    person1?: { name: string; datetime: string; location: string };
    person2?: { name: string; datetime: string; location: string };
    from_date?: string;
    to_date?: string;
  }
): EngineInput {
  switch (type) {
    case "birth": {
      if (!args.name || !args.datetime || !args.location) {
        throw new Error("birth requires name, datetime, location");
      }
      return { birth_data: buildBirthData(args.name, args.datetime, args.location), options: {} };
    }
    case "compatibility": {
      if (!args.person1 || !args.person2) {
        throw new Error("compatibility requires two people");
      }
      return {
        birth_data: buildBirthData(args.person1.name, args.person1.datetime, args.person1.location),
        options: {
          partner_birth_data: buildBirthData(args.person2.name, args.person2.datetime, args.person2.location),
          relationship_context: { type: "compatibility", mapping_goal: "synergy" },
        },
      };
    }
    case "transit": {
      if (!args.name || !args.datetime || !args.location || !args.from_date || !args.to_date) {
        throw new Error("transit requires name, datetime, location, from_date, to_date");
      }
      return {
        birth_data: buildBirthData(args.name, args.datetime, args.location),
        current_time: `${args.from_date}T00:00:00Z`,
        options: {
          transit_window_end: `${args.to_date}T00:00:00Z`,
        },
      };
    }
  }
}

export function subjectNameFromPayload(
  type: "birth" | "compatibility" | "transit",
  payload: EngineInput
): string {
  if (type === "compatibility" && payload.options?.partner_birth_data) {
    const p1 = payload.birth_data?.name ?? "person1";
    const p2 = (payload.options.partner_birth_data as BirthDataInput).name ?? "person2";
    return `${p1}-and-${p2}`;
  }
  return payload.birth_data?.name ?? "selemene";
}
