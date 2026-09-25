import "./globals.css";

export const metadata = {
  title: "Product Feedback Analyzer",
  description:
    "Paste customer reviews and get instant AI-powered insights: sentiment, themes, complaints, feature requests, and suggested improvements.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="page">
          <header className="page-header">
            <h1 className="app-title">
              Product Feedback <span className="app-title-accent">Analyzer</span>
            </h1>
            <p className="app-subtitle">
              Paste customer reviews and get instant, structured insights — sentiment,
              themes, complaints, and suggested improvements.
            </p>
          </header>

          <main>{children}</main>

          <footer className="page-footer">
            <p>
              Nothing is stored: reviews and results live only in your browser and are
              processed in memory.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
