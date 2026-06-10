export function getArticleUrl(article = {}) {
  return article.articleUrl || article.externalUrl || '#'
}

export function isMeanwellOfficialArticle(article = {}) {
  if (article.source === 'meanwell-official') return true
  try {
    return /(^|\.)meanwell\.com$/i.test(new URL(getArticleUrl(article)).hostname)
  } catch {
    return false
  }
}

export function hasTranslatedArticle(article = {}) {
  return isMeanwellOfficialArticle(article) && (article.summary || article.body?.length || article.keyPoints?.length)
}
