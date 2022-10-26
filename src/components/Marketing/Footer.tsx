import { Container } from '@/components/Marketing/Container'
import { Logo } from '@/components/Marketing/Logo'

export function Footer() {
  return (
    <footer className="bg-slate-50 flex-none">
      <Container>
        <div className="py-16">
          <div className="flex items-center justify-center mx-auto">
            <Logo className="h-10 w-auto" />
            <h1 className="lowercase font-bold font-['Comfortaa']">Spackle</h1>
          </div>
        </div>
        <div className="flex flex-col items-center border-t border-slate-400/10 py-10 sm:flex-row-reverse sm:justify-between">
          <p className="mt-6 text-sm text-slate-500 sm:mt-0">
            Copyright &copy; {new Date().getFullYear()} Bolder Research LLC. All
            rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  )
}
