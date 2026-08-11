import Sidebar from './Sidebar'
import HeaderInstitucional from './HeaderInstitucional'
import Footer from './Footer'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <HeaderInstitucional />
      <div className="main-shell">
        <Sidebar />
        <main className="main-content">
          {children}
          <Footer />
        </main>
      </div>
    </>
  )
}