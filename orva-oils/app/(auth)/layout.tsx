import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <div className="pt-[72px] flex-1">{children}</div>
      <Footer />
    </>
  );
}
