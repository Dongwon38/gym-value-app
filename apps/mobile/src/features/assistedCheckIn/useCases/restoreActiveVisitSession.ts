import {
  getActiveVisit,
  getLatestLocationPrompt,
} from '../../../data/repositories';

export async function restoreActiveVisitSession() {
  const activeVisit = await getActiveVisit();

  if (!activeVisit) {
    return {
      activeVisit: null,
      latestPrompt: await getLatestLocationPrompt(),
    };
  }

  const relatedPrompt = await getLatestLocationPrompt({
    relatedVisitId: activeVisit.id,
  });

  if (relatedPrompt) {
    return {
      activeVisit,
      latestPrompt: relatedPrompt,
    };
  }

  return {
    activeVisit,
    latestPrompt: await getLatestLocationPrompt({ gymId: activeVisit.gymId }),
  };
}
