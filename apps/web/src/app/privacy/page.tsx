import { Container } from '@/components/tailwindui/container'
import fs from 'fs'
import { join } from 'path'

async function getPrivacyHTML() {
  const privacyHTMLPath = join(
    process.cwd(),
    'src',
    'app',
    'privacy',
    'privacy.html',
  )

  const source = await fs.promises.readFile(privacyHTMLPath, 'utf8')
  return source
}

export default async function Privacy() {
  const privacyHTML = await getPrivacyHTML()
  return (
    <Container className="text-white">
      <div dangerouslySetInnerHTML={{ __html: privacyHTML }} />
    </Container>
  )
}
