import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.GITHUB_ACTIONS === "true" ? "/ssu-degree-map" : "";

export const metadata: Metadata = {
  title: "SSU DegreeMap",
  description: "숭실대학교 학생의 졸업요건 충족 여부와 다음 행동을 근거와 함께 보여주는 DegreeMap MVP",
  icons: { icon: `${basePath}/favicon.svg`, shortcut: `${basePath}/favicon.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
