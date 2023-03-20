import { Container } from '@/app/Container'
import { Logo } from '@/app/Logo'
import { comfortaa } from '@/app/font'

export function Footer() {
  return (
    <footer className="flex-none">
      <Container>
        <div className="pb-16">
          <div className="mx-auto flex items-center justify-center">
            <Logo className="h-10 w-auto" />
            <h1
              className={`${comfortaa.className} font-bold lowercase dark:text-white`}
            >
              Spackle
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center py-10 sm:flex-row-reverse sm:justify-between">
          <p className="mt-6 text-sm text-slate-400 sm:mt-0">
            Copyright &copy; {new Date().getFullYear()} Bolder Research LLC. All
            rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  )
}
