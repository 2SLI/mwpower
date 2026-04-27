export const newsArticles = []

function toTimestamp(dateText) {
  return new Date(`${dateText}T00:00:00+09:00`).getTime()
}

export function getAllNewsSorted() {
  return [...newsArticles].sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
}

export function getNewsById(articleId) {
  return newsArticles.find((article) => article.id === articleId) ?? null
}

export function formatNewsDate(dateText) {
  return String(dateText ?? '').replaceAll('-', '.')
}
