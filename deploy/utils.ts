import {AchievementEnum} from '../src/db';
import {getUrl} from '../src/utils';

export function getAchievementUrl(
  id: AchievementEnum,
  repo: string,
  ext: string,
  level?: number,
) {
  return getUrl(
    `/achievements/${repo}/${id}${typeof level === 'number' ? `/${level}` : ''}.${ext}`,
  );
}

export function generateAssetUrls(
  id: AchievementEnum,
  points: number[] | undefined,
) {
  return {
    iconImageUrl: getUrl(`/achievements/icons/${id}.svg`),
    storyImageUrls: !points || points.length === 0
      ? [getAchievementUrl(id, 'stories', 'jpg')]
      : points.map((_, idx) => getAchievementUrl(id, 'stories', 'jpg', idx + 1)),
    snippetImageUrls: !points || points.length === 0
      ? [getAchievementUrl(id, 'snippets', 'png')]
      : points.map((_, idx) => getAchievementUrl(id, 'snippets', 'png', idx + 1)),
  };
}
