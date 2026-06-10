import './globals.css';

export const metadata = {
  title: 'Meter Tracker',
  description: 'Track meter readings and bills for your rental properties',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
