import { archiveTopics as storyTopics } from '../../../../shared/bulletins';
import type { ArchiveTopic as StoryTopic, BulletinStory } from '../../../../shared/bulletins';
export { archiveTopicLabels as storyTopicLabels } from '../../../../shared/bulletins';
export type { ArchiveTopic as StoryTopic } from '../../../../shared/bulletins';

export function groupStories(stories: BulletinStory[]) {
  const byTopic = new Map<StoryTopic, BulletinStory[]>();
  for (const story of stories) {
    const topic = story.topic ?? 'khac';
    const group = byTopic.get(topic);
    if (group) group.push(story);
    else byTopic.set(topic, [story]);
  }
  return storyTopics.flatMap((topic) => {
    const group = byTopic.get(topic);
    return group ? [{ topic, stories: group }] : [];
  });
}

export function topicSearch(params: URLSearchParams, topic?: StoryTopic) {
  const next = new URLSearchParams(params);
  next.delete('trang');
  if (topic) next.set('chu-de', topic);
  else next.delete('chu-de');
  return next.toString();
}
