import Sidebar from './Sidebar'
import Footer from './Footer'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
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