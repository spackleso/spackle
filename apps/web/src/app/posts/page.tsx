import { Container } from '@/app/Container'

export default function BlogPage() {
  return (
    <main className="flex flex-grow flex-col pb-16">
      <Container className="flex w-full flex-col items-center pb-16">
        <div className="prose dark:prose-invert w-full max-w-none"></div>
      </Container>
    </main>
  )
}
