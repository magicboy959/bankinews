import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { message, details } }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ ok: false, error: { message } }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ ok: false, error: { message } }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ ok: false, error: { message } }, { status: 404 });
}

export function serverError(message = "Server error") {
  return NextResponse.json({ ok: false, error: { message } }, { status: 500 });
}
