import { prisma } from "@daily-news/db";

export async function listKeywords() {
  return prisma.keyword.findMany({
    orderBy: { term: "asc" }
  });
}

export async function replaceKeywords(
  keywords: Array<{ term: string; active: boolean }>
) {
  await prisma.$transaction([
    prisma.keyword.deleteMany({}),
    prisma.keyword.createMany({
      data: keywords.map((keyword) => ({
        term: keyword.term,
        active: keyword.active
      }))
    })
  ]);
}
