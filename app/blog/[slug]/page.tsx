import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogSuggestionForm } from "@/components/blog-suggestion-form";
import { getBlogPost } from "@/lib/data";
import { getTown } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` }
  };
}

function date(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Denver" }).format(new Date(value));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <main className="container-site py-10 sm:py-12">
      <div className="grid gap-10 lg:grid-cols-[1.35fr_.65fr]">
        <article className="max-w-3xl">
          <Link href="/blog" className="text-sm font-medium text-[#526058] hover:underline">← Local blog</Link>
          <p className="mt-6 text-xs text-[#777d78]">{date(post.publishedAt)} · {post.town ? getTown(post.town)?.name : "Roaring Fork Valley"}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.025em] sm:text-4xl">{post.title}</h1>
          <p className="mt-4 border-b border-[#d9dbd5] pb-6 text-base leading-7 text-[#596159]">{post.excerpt}</p>
          <div className="prose-local mt-7">
            {post.body.split(/\n\n+/).map((paragraph, index) => <p key={index} className={index ? "mt-5" : ""}>{paragraph}</p>)}
          </div>
          <p className="mt-8 text-xs text-[#777d78]">By {post.authorName}</p>
        </article>
        <aside>
          <BlogSuggestionForm />
        </aside>
      </div>
    </main>
  );
}
