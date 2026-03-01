import {} from "./schema";
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const flights = mysqlTable("flights", {
  id: int("id").autoincrement().primaryKey(),
  icao24: varchar("icao24", { length: 6 }).notNull(),
  callsign: varchar("callsign", { length: 8 }),
  originCountry: varchar("originCountry", { length: 64 }),
  timePosition: int("timePosition"),
  lastContact: int("lastContact"),
  longitude: varchar("longitude", { length: 20 }),
  latitude: varchar("latitude", { length: 20 }),
  baroAltitude: varchar("baroAltitude", { length: 20 }),
  onGround: int("onGround"),
  velocity: varchar("velocity", { length: 20 }),
  trueTrack: varchar("trueTrack", { length: 20 }),
  verticalRate: varchar("verticalRate", { length: 20 }),
  geoAltitude: varchar("geoAltitude", { length: 20 }),
  squawk: varchar("squawk", { length: 4 }),
  spi: int("spi"),
  positionSource: int("positionSource"),
  category: int("category"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const flightHistory = mysqlTable("flight_history", {
  id: int("id").autoincrement().primaryKey(),
  icao24: varchar("icao24", { length: 24 }).notNull(),
  latitude: varchar("latitude", { length: 20 }).notNull(),
  longitude: varchar("longitude", { length: 20 }).notNull(),
  altitude: varchar("geoAltitude", { length: 20 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type Flight = typeof flights.$inferSelect;
export type InsertFlight = typeof flights.$inferInsert;

export const airports = mysqlTable("airports", {
  id: int("id").autoincrement().primaryKey(),
  icaoCode: varchar("icaoCode", { length: 4 }).notNull().unique(),
  iataCode: varchar("iataCode", { length: 3 }),
  name: varchar("name", { length: 128 }).notNull(),
  city: varchar("city", { length: 64 }),
  country: varchar("country", { length: 64 }).notNull(),
  latitude: varchar("latitude", { length: 20 }).notNull(),
  longitude: varchar("longitude", { length: 20 }).notNull(),
  elevation: int("elevation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Airport = typeof airports.$inferSelect;
export type InsertAirport = typeof airports.$inferInsert;