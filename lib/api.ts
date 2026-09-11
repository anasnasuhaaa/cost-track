import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof SyntaxError) {
    return Response.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }
  if (error instanceof ZodError) {
    return Response.json({ error: "Data tidak valid.", fields: error.flatten().fieldErrors }, { status: 400 });
  }
  console.error("Request failed", error instanceof Error ? error.message : "Unknown error");
  return Response.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 });
}

export function unauthorized() {
  return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
}

export function notFound() {
  return Response.json({ error: "Data tidak ditemukan." }, { status: 404 });
}
