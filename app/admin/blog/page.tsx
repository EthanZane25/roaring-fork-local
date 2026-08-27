import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminBlogPostForm } from "@/components/admin-blog-post-form";
import { getAdminContext } from "@/lib/admin";

export const metadata = { title: "Blog admin", robots: { index: false, follow: false } };

export default async function AdminBlogPage() {
  const context = await getAdminContext();
  if (!context) redirect("/sign-in");
  const [{ data: posts }, { data: suggestions }] = await Promise.all([
    context.supabase.from("blog_posts").select("id,slug,title,status,published_at").order("created_at", { ascending: false }).limit(30),
    context.supabase.from("blog_suggestions").select("id,name,email,town_slug,subject,suggestion,status,created_at").order("created_at", { ascending: false }).limit(50)
  ]);

  return (
    <main className="container-site py-12">
      <Link href="/admin" className="text-sm font-medium text-[#526058] hover:underline">← Admin</Link>
      <div className="mt-5 flex items-end justify-between gap-4"><div><p className="eyebrow">Publishing</p><h1 className="mt-2 text-3xl font-semibold">Blog & suggestions</h1></div><Link href="/blog" className="text-sm font-semibold text-[#173f30] hover:underline">View blog</Link></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_.9fr]">
        <AdminBlogPostForm />
        <section>
          <h2 className="text-lg font-semibold">Recent posts</h2>
          <div className="mt-3 border-y border-[#d9dbd5] bg-white">
            {(posts ?? []).map((post: any, index: number) => <div key={post.id} className={`px-2 py-3 ${index ? "border-t border-[#e1e3dd]" : ""}`}><div className="flex items-center justify-between gap-3"><Link href={`/blog/${post.slug}`} className="text-sm font-semibold hover:underline">{post.title}</Link><span className="text-xs text-[#737a74]">{post.status}</span></div></div>)}
          </div>
        </section>
      </div>
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Community suggestions</h2>
        <p className="mt-1 text-sm text-[#666c67]">Suggestions are private until an editor chooses to use them in a story.</p>
        <div className="mt-4 overflow-x-auto border border-[#d9dbd5] bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#d9dbd5] bg-[#f4f3ef] text-xs text-[#666c67]"><tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">From</th><th className="px-4 py-3">Town</th><th className="px-4 py-3">Suggestion</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody>{(suggestions ?? []).map((item: any) => <tr key={item.id} className="border-t border-[#ecece8]"><td className="px-4 py-3 font-medium">{item.subject}</td><td className="px-4 py-3 text-[#626862]">{item.name || "Anonymous"}{item.email ? <div className="text-xs">{item.email}</div> : null}</td><td className="px-4 py-3 text-[#626862]">{item.town_slug || "Valley"}</td><td className="max-w-xl px-4 py-3 text-[#505650]">{item.suggestion}</td><td className="px-4 py-3 text-xs">{item.status}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
