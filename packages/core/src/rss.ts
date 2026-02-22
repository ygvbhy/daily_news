import { XMLParser } from "fast-xml-parser";

export type RssItem = {
  title: string;
  link: string;
  pubDate: Date | null;
  source: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
  trimValues: true
});

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseRss(xml: string, source: string): RssItem[] {
  const parsed = parser.parse(xml);
  const items = toArray(parsed?.rss?.channel?.item);

  return items
    .map((item: any) => {
      const title = typeof item.title === "string" ? item.title : "";
      const link = typeof item.link === "string" ? item.link : "";
      const pubDateRaw = typeof item.pubDate === "string" ? item.pubDate : "";
      const pubDate = pubDateRaw ? new Date(pubDateRaw) : null;
      return {
        title,
        link,
        pubDate: Number.isNaN(pubDate?.getTime()) ? null : pubDate,
        source
      };
    })
    .filter((item: RssItem) => item.title && item.link);
}
