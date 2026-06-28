// app/page.tsx  (or pages/index.tsx if using pages directory)
import { redirect } from "next/navigation";

export default function Home() {
  // Redirect root / → /en
  redirect("/en");
  
}
