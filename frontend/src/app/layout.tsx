import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RPA LAD-6819 | Orquestador de Descuentos de Nómina",
  description: "Plataforma de gestión, carga masiva, reglas de negocio y pagos individuales de nómina.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-background text-on-surface min-h-screen">
        {children}
      </body>
    </html>
  );
}
