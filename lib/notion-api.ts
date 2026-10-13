import { NotionAPI } from 'notion-client'

export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL
})

const notionFetch = notion.fetch.bind(notion)

// Notion rejects the default client request during page regeneration.
notion.fetch = (async (args) => {
  const gotOptions = args.gotOptions || {}

  return notionFetch({
    ...args,
    gotOptions: {
      ...gotOptions,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; pku-jingchu/1.0; +https://pkujingchu.cn)',
        ...gotOptions.headers
      }
    }
  })
}) as typeof notion.fetch
