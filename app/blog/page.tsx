import type { Metadata } from "next";
import Link from "next/link";
import { BlogSuggestionForm } from "@/components/blog-suggestion-form";
import { getBlogPosts } from "@/lib/data";
import { getTown } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Local Blog & Community Suggestions",
  description: "Local stories, practical guides and community suggestions from Aspen through Rifle."
};

function date(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Denver" }).format(new Date(value));
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return (
    <main className="container-site py-10 sm:py-12">
      <div className="max-w-3xl">
        <p className="eyebrow">Local blog</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.025em] sm:text-4xl">Useful local stories and guides.</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#626862]">Restaurant updates, local guides, community information and practical stories from Aspen through Rifle.</p>
      </div>

      <div className="mt-9 grid gap-10 lg:grid-cols-[1.4fr_.8fr]">
        <section>
          <div className="border-y border-[#d9dbd5] bg-white">
            {posts.map((post, index) => (
              <article key={post.id} className={`py-5 ${index ? "border-t border-[#e1e3dd]" : ""}`}>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#777d78]">
                  <span>{date(post.publishedAt)}</span>
                  {post.town ? <span>{getTown(post.town)?.name}</span> : <span>Roaring Fork Valley</span>}
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-[-.015em]"><Link href={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link></h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#596159]">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`} className="mt-3 inline-block text-sm font-semibold text-[#173f30] hover:underline">Read more</Link>
              </article>
            ))}
          </div>
        </section>
        <aside>
          <BlogSuggestionForm />
        </aside>
      </div>
    </main>
  );
}
