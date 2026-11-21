import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/features/school/lesson-player";
import { LESSONS, lessonBySlug } from "@/lib/content/lessons";
import { getLessonProgress, getSession } from "@/lib/data/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: lessonBySlug(slug)?.title ?? "Lección" };
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) notFound();

  await getSession();
  const progress = await getLessonProgress();
  const next = LESSONS.find((l) => l.order > lesson.order && !(l.slug in progress)) ?? LESSONS.find((l) => l.order === lesson.order + 1) ?? null;

  return (
    <LessonPlayer
      key={lesson.slug}
      lesson={lesson}
      next={next ? { slug: next.slug, title: next.title } : null}
      bestScore={progress[lesson.slug] ?? null}
    />
  );
}
