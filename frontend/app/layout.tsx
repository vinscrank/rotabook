import { Outfit } from "next/font/google";
import "./globals.css";
import SoftBackdrop from "@/components/SoftBackdrop";
import { AuthProvider } from "@/context/AuthContext";
import { Metadata } from "next";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RotaBook",
    template: "%s | RotaBook",
  },
  description: "Realtime booking and staff rota platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.variable}>
        <AuthProvider>
          <SoftBackdrop />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
