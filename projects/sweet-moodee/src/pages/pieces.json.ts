import type { APIRoute } from "astro";
import { getPieces } from "../lib/pieces";

// Light catalogue for the « Elle me va ? » sheet, fetched once when the sheet hydrates.
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getPieces()), { headers: { "Content-Type": "application/json; charset=utf-8" } });
