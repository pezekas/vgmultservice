import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "VG Multiservice | A sua Gráfica Digital",
    template: "%s | VG Multiservice",
  },
  description: "Soluções gráficas, adesivos, placas e comunicação visual com atendimento próximo da VG Multiservice.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "VG Multiservice",
    title: "VG Multiservice | A sua Gráfica Digital",
    description: "Impressão que transforma ideias em realidade.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body><CartProvider>{children}</CartProvider></body>
    </html>
  );
}
