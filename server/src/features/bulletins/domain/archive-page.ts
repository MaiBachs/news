import { archivePageSize, archiveTopicLabels, archiveTopics, storySourceLabels } from '../../../../../shared/bulletins.js';
import type { ArchivePage, ArchiveQuery, ArchiveTopic, BulletinStory } from '../../../../../shared/bulletins.js';

const groupPreviewSize = 3;
const chartDates = 7;

export function buildArchivePage(stories: Iterable<BulletinStory>, query: ArchiveQuery): ArchivePage {
  const keyword = normalize(query.search.trim());
  const available = new Set<ArchiveTopic>();
  const groups = new Map<ArchiveTopic, ArchivePage['groups'][number]>();
  const allChart = dateCounts();
  const topicChart = dateCounts();
  let total = 0;

  for (const story of stories) {
    const score = story.score;
    if (query.minScore !== undefined && !(typeof score === 'number' && Number.isInteger(score) && score >= query.minScore && score <= 12)) continue;
    const topic = story.topic ?? 'khac';
    available.add(topic);
    if ((query.market && story.market !== query.market) || (keyword && !searchText(story, topic).includes(keyword))) continue;
    total++;
    allChart.add(story.publishedOn);
    if (topic === query.topic) topicChart.add(story.publishedOn);
    let group = groups.get(topic);
    if (!group) {
      group = { topic, count: 0, stories: [] };
      groups.set(topic, group);
    }
    const index = group.count++;
    if (topic === query.topic ? index >= query.offset && group.stories.length < archivePageSize : index < groupPreviewSize) {
      group.stories.push(story);
    }
  }

  const activeTopic = query.topic && available.has(query.topic) ? query.topic : null;
  const choices = archiveTopics.filter((topic) => available.has(topic)).map((topic) => ({ topic, count: groups.get(topic)?.count ?? 0 }));
  return {
    total, activeTopic, choices,
    selectedTotal: activeTopic ? groups.get(activeTopic)?.count ?? 0 : total,
    groups: archiveTopics.flatMap((topic) => {
      const group = groups.get(topic);
      return group && (!activeTopic || topic === activeTopic) ? [group] : [];
    }),
    chart: activeTopic ? topicChart.result() : allChart.result(),
  };
}

function searchText(story: BulletinStory, topic: ArchiveTopic) {
  return normalize([
    story.title, story.source, story.summary, story.translation?.title ?? story.title,
    story.translation?.summary ?? story.summary, storySourceLabels.get(story.source) ?? story.source,
    archiveTopicLabels[topic], ...(story.digest?.keyPoints ?? []),
  ].join(' '));
}

function normalize(value: string) {
  return value.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd');
}

function dateCounts() {
  const dates = new Map<string, number>();
  let undatedCount = 0;
  let olderCount = 0;
  return {
    // Repository rows arrive newest first. After seven distinct dates, older rows only need a total.
    add(date: string | null) {
      if (!date) undatedCount++;
      else if (dates.has(date) || dates.size < chartDates) dates.set(date, (dates.get(date) ?? 0) + 1);
      else olderCount++;
    },
    result: () => ({ dates: [...dates].reverse().map(([date, count]) => ({ date, count })), olderCount, undatedCount }),
  };
}
