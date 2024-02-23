import { join } from 'path'

export const postsDirectory = join(process.cwd(), 'posts')

export type FrontMatter = {
  title: string
  excerpt: string
  isPublished: boolean
  publishedDate: string
  updatedDate: string
}
