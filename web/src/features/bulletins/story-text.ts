import type { BulletinStory } from '../../../../shared/bulletins';
import { storySourceLabels } from '../../../../shared/bulletins';

export function storyText(story: BulletinStory) {
  return {
    title: story.translation?.title ?? story.title,
    summary: story.translation?.summary ?? story.summary,
    source: storySourceLabels.get(story.source) ?? story.source,
  };
}
