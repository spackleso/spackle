import fs from 'fs'
import { Container } from '@/components/tailwindui/container'
import Markdoc from '@markdoc/markdoc'
import yaml from 'js-yaml'
import Link from 'next/link'
import { postsDirectory, FrontMatter } from './constants'
import { join } from 'path'

async function getPosts() {
  const files = fs.readdirSync(postsDirectory)
  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, '')
      const source = fs.readFileSync(join(postsDirectory, `${slug}.md`), 'utf8')
      const ast = Markdoc.parse(source)
      const { title, excerpt, isPublished, publishedDate, updatedDate } = (
        ast.attributes.frontmatter ? yaml.load(ast.attributes.frontmatter) : {}
      ) as FrontMatter

      return {
        slug,
        title,
        excerpt,
        isPublished,
        publishedDate: new Date(publishedDate),
        updatedDate: new Date(updatedDate),
      }
    })
    .filter((post) => post.isPublished)
    .sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime())
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main className="flex flex-grow flex-col">
      <Container className="my-8 flex w-full flex-col items-center gap-y-12">
        <div className="prose lg:prose-xl dark:prose-invert w-full">
          <h1>Blog</h1>
        </div>
        <div className="flex flex-col gap-y-8">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="prose dark:prose-invert w-full max-w-none"
            >
              <Link className="no-underline" href={`/posts/${post.slug}`}>
                <h2 className="text-3xl">{post.title}</h2>
              </Link>
              <p>{post.excerpt}</p>
              <Link href={`/posts/${post.slug}`}>Read more</Link>
            </div>
          ))}
        </div>
      </Container>
    </main>
  )
}
