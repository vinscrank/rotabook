import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import LenisScroll from "@/components/lenis";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LenisScroll />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
