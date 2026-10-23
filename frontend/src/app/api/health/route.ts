import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ONLINE",
      timestamp: new Date().toISOString(),
      service: "RPA LAD-6819 Fullstack Engine",
      runtime: "Node.js (Next.js 14 App Router)",
      stack: "TypeScript + SheetJS + Firebase Firestore",
      version: "2.0.0",
      pythonDeprecation: "Backend migrado 100% a TypeScript / Next.js",
    },
    { status: 200 }
  );
}
