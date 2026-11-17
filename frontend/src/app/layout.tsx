import type { Metadata } from "next";
import "./globals.css";
import { AccessibilityWidget } from "../components/AccessibilityWidget";

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
        <a href="#main-content" className="skip-to-content">
          Saltar al contenido principal
        </a>
        <div id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </div>
        <AccessibilityWidget />
      </body>
    </html>
  );
}
