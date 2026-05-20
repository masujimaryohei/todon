import "./globals.css";

import { M_PLUS_Rounded_1c } from 'next/font/google';

const todonFont = M_PLUS_Rounded_1c({
  variable: '--font-todon',
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
});

export const metadata = {
  title: 'TodoN（トドン）',
  description: '個人とチームのタスクを詰まらせずに進めるためのアプリ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${todonFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
