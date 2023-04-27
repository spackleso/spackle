import fs from 'fs'
import { Container } from '@/app/Container'
import Markdoc from '@markdoc/markdoc'
import yaml from 'js-yaml'
import { join } from 'path'
import Link from 'next/link'

const postsDirectory = join(process.cwd(), 'posts')

interface FrontMatter {
  title: string
  excerpt: string
}

async function getPosts(slug: string) {
  const files = fs.readdirSync(postsDirectory)
  return files.map((file) => {
    const slug = file.replace(/\.md$/, '')
    const source = fs.readFileSync(join(postsDirectory, `${slug}.md`), 'utf8')
    const ast = Markdoc.parse(source)
    const { title, excerpt } = (
      ast.attributes.frontmatter ? yaml.load(ast.attributes.frontmatter) : {}
    ) as FrontMatter

    return {
      slug,
      title,
      excerpt,
    }
  })
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main className="flex flex-grow flex-col pb-16">
      <Container className="flex w-full flex-col items-center pb-16">
        <div className="prose lg:prose-xl dark:prose-invert w-full">
          <h1>Blog</h1>
        </div>
        <div className="prose lg:prose-xl dark:prose-invert w-full">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="prose dark:prose-invert w-full max-w-none"
            >
              <Link href={`/posts/${post.slug}`}>
                <h2>{post.title}</h2>
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
