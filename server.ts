import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertFlight, flights, InsertAirport, airports } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[FlightService] Failed to connect to database:", error);
      _db = null;
    }
  }
  return _db;
}

const KENYA_BOUNDS = {
  latMin: -4.7,
  latMax: 5.5,
  lonMin: 33.9,
  lonMax: 41.9,
};

const OPENSKY_API_URL = "https://opensky-network.org/api/states/all";

const AIRCRAFT_CATEGORIES: Record<number, string> = {
  0: "No information",
  1: "No ADS-B Emitter Category",
  2: "Light",
  3: "Small",
  4: "Large",
  5: "High Vortex Large",
  6: "Heavy",
  7: "High Performance",
  8: "Rotorcraft",
  9: "Glider",
  10: "Lighter-than-air",
  11: "Parachutist",
  12: "Ultralight",
  13: "Reserved",
  14: "Unmanned Aerial Vehicle",
  15: "Space Vehicle",
  16: "Emergency Vehicle",
  17: "Service Vehicle",
  18: "Point Obstacle",
  19: "Cluster Obstacle",
  20: "Line Obstacle",
};

const POSITION_SOURCES: Record<number, string> = {
  0: "ADS-B",
  1: "ASTERIX",
  2: "MLAT",
  3: "FLARM",
};

interface OpenSkyResponse {
  time: number;
  states: Array<
    | [
        string,
        string | null,
        string,
        number | null,
        number | null,
        number | null,
        number | null,
        number | null,
        boolean,
        number | null,
        number | null,
        number | null,
        number[] | null,
        number | null,
        string | null,
        boolean,
        number,
        number
      ]
    | null
  >;
}

export async function fetchKenyanFlights(): Promise<InsertFlight[]> {
  try {
    const params = new URLSearchParams({
      lamin: KENYA_BOUNDS.latMin.toString(),
      lomin: KENYA_BOUNDS.lonMin.toString(),
      lamax: KENYA_BOUNDS.latMax.toString(),
      lomax: KENYA_BOUNDS.lonMax.toString(),
    });

    const response = await fetch(`${OPENSKY_API_URL}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[FlightService] OpenSky API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: OpenSkyResponse = await response.json();

    if (!data.states || !Array.isArray(data.states)) {
      console.warn("[FlightService] No states in OpenSky response");
      return [];
    }
      const flightData: InsertFlight[] = data.states
      .filter((state): state is NonNullable<typeof state> => state !== null)
      .map((state) => ({
        icao24: state[0],
        callsign: state[1]?.trim() || null,
        originCountry: state[2],
        timePosition: state[3],
        lastContact: state[4],
        longitude: state[5]?.toString() || null,
        latitude: state[6]?.toString() || null,
        baroAltitude: state[7]?.toString() || null,
        onGround: state[8] ? 1 : 0,
        velocity: state[9]?.toString() || null,
        trueTrack: state[10]?.toString() || null,
        verticalRate: state[11]?.toString() || null,
        geoAltitude: state[13]?.toString() || null,
        squawk: state[14],
        spi: state[15] ? 1 : 0,
        positionSource: state[16],
        category: state[17],
      }));

    console.log(`[FlightService] Fetched ${flightData.length} flights from Kenyan airspace`);
    return flightData;
  } catch (error) {
    console.error("[FlightService] Failed to fetch flights from OpenSky:", error);
    return [];
  }
}

export function getAircraftCategoryName(category: number): string {
  return AIRCRAFT_CATEGORIES[category] || "Unknown";
}

export function isInKenyaBounds(latitude: number, longitude: number): boolean {
  return (
    latitude >= KENYA_BOUNDS.latMin &&
    latitude <= KENYA_BOUNDS.latMax &&
    longitude >= KENYA_BOUNDS.lonMin &&
    longitude <= KENYA_BOUNDS.lonMax
  );
}

export async function getKenyanFlights() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(flights)
      .where(sql`${flights.latitude} IS NOT NULL AND ${flights.longitude} IS NOT NULL`)
      .orderBy(flights.callsign);
    return result;
  } catch (error) {
    console.error("[FlightService] Failed to fetch Kenyan flights from database:", error);
    return [];
  }
}

export async function upsertFlight(flight: InsertFlight): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .insert(flights)
      .values(flight)
      .onDuplicateKeyUpdate({
        set: {
          callsign: flight.callsign,
          originCountry: flight.originCountry,
          timePosition: flight.timePosition,
          lastContact: flight.lastContact,
          longitude: flight.longitude,
          latitude: flight.latitude,
          baroAltitude: flight.baroAltitude,
          onGround: flight.onGround,
          velocity: flight.velocity,
          trueTrack: flight.trueTrack,
          verticalRate: flight.verticalRate,
          geoAltitude: flight.geoAltitude,
          squawk: flight.squawk,
          spi: flight.spi,
          positionSource: flight.positionSource,
          category: flight.category,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[FlightService] Failed to upsert flight:", error);
  }
}

export async function getAirports() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(airports).orderBy(airports.name);
    return result;
  } catch (error) {
    console.error("[FlightService] Failed to fetch airports:", error);
    return [];
  }
}

export async function seedAirports(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const kenyanAirports: InsertAirport[] = [
    {
      icaoCode: "HKJK",
      iataCode: "NBO",
      name: "Jomo Kenyatta International Airport",
      city: "Nairobi",
      country: "Kenya",
      latitude: "-1.3192",
      longitude: "36.9293",
      elevation: 5330,
    },
    {
      icaoCode: "HKMO",
      iataCode: "MBA",
      name: "Moi International Airport",
      city: "Mombasa",
      country: "Kenya",
      latitude: "-4.0242",
      longitude: "39.5947",
      elevation: 171,
    },
    {
      icaoCode: "HKEL",
      iataCode: "EDL",
      name: "Eldoret International Airport",
      city: "Eldoret",
      country: "Kenya",
      latitude: "0.4031",
      longitude: "35.2394",
      elevation: 7079,
    },
    {
      icaoCode: "HKKI",
      iataCode: "KIS",
      name: "Kisumu International Airport",
      city: "Kisumu",
      country: "Kenya",
      latitude: "-0.0428",
      longitude: "34.7289",
      elevation: 3720,
    },
    {
      icaoCode: "HKNW",
      iataCode: "WIL",
      name: "Wilson Airport",
      city: "Nairobi",
      country: "Kenya",
      latitude: "-1.3196",
      longitude: "36.8025",
      elevation: 5381,
    },
  ];

  try {
    for (const airport of kenyanAirports) {
      await db
        .insert(airports)
        .values(airport)
        .onDuplicateKeyUpdate({
          set: {
            name: airport.name,
            city: airport.city,
            latitude: airport.latitude,
            longitude: airport.longitude,
            elevation: airport.elevation,
          },
        });
    }
    console.log("[FlightService] Kenyan airports seeded successfully");
  } catch (error) {
    console.error("[FlightService] Failed to seed airports:", error);
  }
}

import { InsertFlight } from "../drizzle/schema";

const KENYA_BOUNDS = {
  latMin: -4.7,
  latMax: 5.5,
  lonMin: 33.9,
  lonMax: 41.9,
};

const OPENSKY_API_URL = "https://opensky-network.org/api/states/all";

const AIRCRAFT_CATEGORIES: Record<number, string> = {
  0: "No information",
  1: "No ADS-B Emitter Category",
  2: "Light",
  3: "Small",
  4: "Large",
  5: "High Vortex Large",
  6: "Heavy",
  7: "High Performance",
  8: "Rotorcraft",
  9: "Glider",
  10: "Lighter-than-air",
  11: "Parachutist",
  12: "Ultralight",
  13: "Reserved",
  14: "Unmanned Aerial Vehicle",
  15: "Space Vehicle",
  16: "Emergency Vehicle",
  17: "Service Vehicle",
  18: "Point Obstacle",
  19: "Cluster Obstacle",
  20: "Line Obstacle",
};

const POSITION_SOURCES: Record<number, string> = {
  0: "ADS-B",
  1: "ASTERIX",
  2: "MLAT",
  3: "FLARM",
};

interface OpenSkyResponse {
  time: number;
  states: Array<
    | [
        string,
        string | null,
        string,
        number | null,
        number | null,
        number | null,
        number | null,
        number | null,
        boolean,
        number | null,
        number | null,
        number | null,
        number[] | null,
        number | null,
        string | null,
        boolean,
        number,
        number
      ]
    | null
  >;
}

export async function fetchKenyanFlights(): Promise<InsertFlight[]> {
  try {
    const params = new URLSearchParams({
      lamin: KENYA_BOUNDS.latMin.toString(),
      lomin: KENYA_BOUNDS.lonMin.toString(),
      lamax: KENYA_BOUNDS.latMax.toString(),
      lomax: KENYA_BOUNDS.lonMax.toString(),
    });

    const response = await fetch(`${OPENSKY_API_URL}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[OpenSky] API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: OpenSkyResponse = await response.json();

    if (!data.states || !Array.isArray(data.states)) {
      console.warn("[OpenSky] No states in response");
      return [];
    }
      const flights: InsertFlight[] = data.states
      .filter((state): state is NonNullable<typeof state> => state !== null)
      .map((state) => ({
        icao24: state[0],
        callsign: state[1]?.trim() || null,
        originCountry: state[2],
        timePosition: state[3],
        lastContact: state[4],
        longitude: state[5]?.toString() || null,
        latitude: state[6]?.toString() || null,
        baroAltitude: state[7]?.toString() || null,
        onGround: state[8] ? 1 : 0,
        velocity: state[9]?.toString() || null,
        trueTrack: state[10]?.toString() || null,
        verticalRate: state[11]?.toString() || null,
        geoAltitude: state[13]?.toString() || null,
        squawk: state[14],
        spi: state[15] ? 1 : 0,
        positionSource: state[16],
        category: state[17],
      }));

    console.log(`[OpenSky] Fetched ${flights.length} flights from Kenyan airspace`);
    return flights;
  } catch (error) {
    console.error("[OpenSky] Failed to fetch flights:", error);
    return [];
  }
}

export function getAircraftCategoryName(category: number): string {
  return AIRCRAFT_CATEGORIES[category] || "Unknown";
}

export function getPositionSourceName(source: number): string {
  return POSITION_SOURCES[source] || "Unknown";
}

export function isInKenyaBounds(latitude: number, longitude: number): boolean {
  return (
    latitude >= KENYA_BOUNDS.latMin &&
    latitude <= KENYA_BOUNDS.latMax &&
    longitude >= KENYA_BOUNDS.lonMin &&
    longitude <= KENYA_BOUNDS.lonMax
  );
}
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getKenyanFlights, getAirports, seedAirports, upsertFlight, fetchKenyanFlights, getAircraftCategoryName } from "./flightService";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  flights: router({
    
    list: publicProcedure.query(async () => {
      const flights = await getKenyanFlights();
      return flights.map((flight) => ({
        ...flight,
        aircraftCategory: flight.category ? getAircraftCategoryName(flight.category) : null,
      }));
    }),

    refresh: publicProcedure.mutation(async () => {
      const flights = await fetchKenyanFlights();
      for (const flight of flights) {
        await upsertFlight(flight);
      }
      return { count: flights.length, timestamp: new Date() };
    }),

    search: publicProcedure
      .input(
        z.object({
          query: z.string().min(1).max(8),
        })
      )
      .query(async ({ input }) => {
        const flights = await getKenyanFlights();
        const query = input.query.toUpperCase();
        return flights
          .filter((flight) => flight.callsign?.includes(query))
          .map((flight) => ({
            ...flight,
            aircraftCategory: flight.category ? getAircraftCategoryName(flight.category) : null,
          }));
      }),
  }),

  airports: router({
    list: publicProcedure.query(async () => {
      return await getAirports();
    }),

    seed: publicProcedure.mutation(async () => {
      await seedAirports();
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;

import { ENV } from './_core/env';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}
