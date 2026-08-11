import Sidebar from './Sidebar';
import Footer from './Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="main-shell">
      <Sidebar />
      <div className="main-content-wrapper">
        <main className="main-content">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}