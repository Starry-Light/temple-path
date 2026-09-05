import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Temple Path — A journey at your pace',description:'A patient-paced 3D temple adventure with untimed movement prompts.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>;}
