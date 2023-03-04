import Head from 'next/head'

import { Footer } from '@/app/Footer'
import { Header } from '@/app/Header'
import { Hero } from '@/app/Hero'
import { Container } from '@/app/Container'
import FeaturePreview from '@/app/FeaturePreview'
import { Fence } from '@/app/Fence'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex h-full min-h-screen flex-col">
      <Header />
      <main className="flex flex-grow flex-col items-center justify-center pb-16">
        <Hero />

        <Container className="flex w-full flex-col justify-center pt-20 pb-16 lg:flex-row lg:items-center lg:space-x-12 lg:pt-32">
          <div className="w-full justify-center lg:w-1/2">
            <h2 className="font-display mx-auto max-w-4xl text-3xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Focus on{' '}
              <span className="relative whitespace-nowrap text-violet-600">
                selling
              </span>
              {', '}
              not configuring
            </h2>
            <p className="mx-auto mt-6 max-w-4xl text-lg tracking-tight text-slate-700 dark:text-slate-400">
              Spackle allows you to fit your product experience to your
              customer’s needs. Toggle features on and off, raise and lower
              limits, and close the deal faster. No engineering required.
            </p>
          </div>
          <div className="mt-8 flex w-full items-center justify-center lg:mt-0 lg:w-1/2">
            <FeaturePreview />
          </div>
        </Container>

        <Container className="flex w-full flex-col pt-20 pb-16 lg:flex-row lg:items-center lg:justify-center lg:space-x-12 lg:pt-32">
          <div className="lg:order-0 bg order-1 mt-6 w-full justify-center overflow-auto rounded-lg bg-slate-900 p-8 shadow-xl dark:bg-black/30 lg:mt-0 lg:w-1/2">
            <Fence language="python">
              {
                'import spackle\nspackle.api_key = "..."\ncustomer = spackle.Customer.retrive("cus_000000000")\ncustomer.enabled("landing_pages")'
              }
            </Fence>
          </div>
          <div className="order-0 w-full justify-center lg:order-1 lg:w-1/2">
            <h2 className="font-display mx-auto max-w-4xl text-3xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              <span className="relative whitespace-nowrap text-violet-600">
                Simple
              </span>{' '}
              integration
            </h2>
            <p className="mx-auto mt-6 max-w-4xl text-lg tracking-tight text-slate-700 dark:text-slate-400">
              Spackle integrates with your current tools with only a few lines
              of code. Focus on building product instead of administrative
              tasks. No more custom flags, webhooks, or complicated feature
              gating.
            </p>
          </div>
        </Container>

        <Container className="flex w-full flex-col pt-20 pb-16 lg:flex-row lg:items-center lg:space-x-12 lg:pt-32">
          <div className="w-full justify-center lg:w-1/2">
            <h2 className="font-display mx-auto max-w-4xl text-3xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Built on{' '}
              <span className="relative whitespace-nowrap text-violet-600">
                Stripe Billing
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-4xl text-lg tracking-tight text-slate-700 dark:text-slate-400">
              Spackle meets you where you already are. All of your customers,
              products, and subscriptions are instantly available for
              customization in Spackle.
            </p>
          </div>
          <div className="align-center lg:0 mt-8 w-full justify-center lg:w-1/2">
            <div className="flex justify-center">
              <Link
                href="https://marketplace.stripe.com/apps/spackle"
                className="rounded-xl border bg-slate-900 p-6"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  fill="none"
                  viewBox="0 0 380 36"
                >
                  <path
                    fill="#FFFFFF"
                    d="M46.752 4.844L40.726 6.12V1.252L46.752 0v4.844zM59.27 7.556c-2.341 0-3.87 1.09-4.705 1.855l-.302-1.484h-5.284v27.746l6.003-1.252.023-6.745c.858.626 2.133 1.507 4.242 1.507 4.288 0 8.205-3.431 8.205-10.964-.046-6.908-3.986-10.663-8.182-10.663zm-1.46 16.388c-1.414 0-2.249-.51-2.828-1.113l-.023-8.83c.626-.696 1.483-1.16 2.85-1.16 2.18 0 3.686 2.434 3.686 5.54.023 3.176-1.46 5.563-3.685 5.563zm28.533-5.493c0-6.097-2.967-10.895-8.669-10.895s-9.155 4.798-9.155 10.848c0 7.163 4.08 10.779 9.92 10.779 2.851 0 5.007-.65 6.653-1.553v-4.752c-1.623.811-3.5 1.298-5.865 1.298-2.318 0-4.38-.811-4.659-3.616h11.729c0-.14 0-.44.023-.765 0-.464.023-1.02.023-1.344zm-11.844-2.272c0-2.689 1.645-3.801 3.175-3.801 1.46 0 3.014 1.112 3.014 3.801h-6.19zM46.752 7.95h-6.026v20.838h6.026V7.95zm-12.864 0l.394 1.762c1.414-2.573 4.219-2.04 4.984-1.762v5.47c-.742-.254-3.153-.602-4.567 1.23v14.115h-6.003V7.95h5.192zM22.275 2.781L16.434 4.01l-.023 19.076c0 3.524 2.665 6.12 6.212 6.12 1.97 0 3.407-.348 4.195-.788v-4.822c-.765.302-4.566 1.414-4.566-2.109v-8.46h4.566V7.95h-4.566l.023-5.169zM8.113 12.702c-1.275 0-2.04.348-2.04 1.275 0 1.02 1.321 1.46 2.967 2.017 2.666.904 6.189 2.086 6.212 6.49 0 4.265-3.43 6.722-8.414 6.722-2.063 0-4.311-.394-6.537-1.368v-5.655c2.017 1.089 4.567 1.9 6.537 1.9 1.344 0 2.295-.348 2.295-1.46 0-1.113-1.438-1.646-3.153-2.248C3.315 19.447 0 18.242 0 14.277c0-4.218 3.245-6.745 8.113-6.745 1.993 0 3.963.302 5.957 1.09v5.586c-1.831-.95-4.15-1.507-5.957-1.507zM364.892 7.938v20.856h14.407v-3.689h-10.195v-5.17h8.539v-3.66h-8.539v-4.647h10.195v-3.69h-14.407zm-16.67 10.428c0-4.241 2.236-7 5.432-7 2.265 0 3.921 1.423 4.502 3.746l4.008-1.336c-1.22-3.776-4.182-6.158-8.51-6.158-5.636 0-9.731 4.444-9.731 10.748 0 6.303 4.095 10.747 9.731 10.747 4.328 0 7.29-2.382 8.51-6.158l-4.008-1.336c-.581 2.324-2.237 3.747-4.502 3.747-3.196 0-5.432-2.76-5.432-7zM331.497 7.938l-7.784 20.856h4.24l1.656-4.473h8.598l1.656 4.473h4.328l-7.814-20.856h-4.88zm2.382 4.735l2.963 8.017h-5.897l2.934-8.017zm-40.709 8.395h4.27c4.793 0 7.785-2.295 7.785-6.594 0-4.328-2.992-6.593-7.785-6.593h-8.539v20.856h4.269v-7.669zm0-3.63v-5.926h4.038c2.498 0 3.776 1.074 3.776 2.963 0 1.859-1.278 2.962-3.776 2.962h-4.038zm14.902 11.356h13.855v-3.689h-9.585V7.938h-4.27v20.856zM286.568 11.57V7.88h-17.37v3.69h6.565v17.167h4.27V11.57h6.535zM252.41 7.88v20.857h14.408v-3.69h-10.196v-5.17h8.54v-3.66h-8.54V11.57h10.196V7.88H252.41zm-15.885.058h-4.27v20.856h4.27v-5.983l2.411-2.73 6.129 8.713h4.996l-8.308-11.938 7.814-8.918h-4.996l-8.046 9.47v-9.47zm-19.931 13.101h2.904l4.822 7.755h4.88l-5.199-8.162c2.933-.842 4.647-2.963 4.647-6.129 0-4.299-2.992-6.565-7.784-6.565h-8.54v20.856h4.27V21.04zm0-3.573v-5.897h4.037c2.498 0 3.776 1.075 3.776 2.963 0 1.86-1.278 2.934-3.776 2.934h-4.037zm-19.221-9.528l-7.785 20.856h4.241l1.656-4.473h8.598l1.655 4.473h4.328l-7.813-20.856h-4.88zm2.382 4.735l2.962 8.017h-5.896l2.934-8.017zM178.25 28.794l5.025-15.279v15.28h4.066V7.937h-5.838l-4.793 14.844-4.822-14.844h-5.925v20.856h4.008V13.515l5.025 15.28h3.254zM104.399 7.95l-7.788 20.838h4.242l1.645-4.473h8.6l1.645 4.473h4.335L109.267 7.95h-4.868zm2.364 4.729l2.967 8.02h-5.887l2.92-8.02zm16.875 8.437h4.265c4.798 0 7.788-2.295 7.788-6.583 0-4.334-2.99-6.583-7.788-6.583h-8.53v20.838h4.265v-7.672zm0-3.616v-5.934h4.033c2.503 0 3.778 1.066 3.778 2.967 0 1.854-1.275 2.967-3.778 2.967h-4.033zm19.377 3.616h4.265c4.799 0 7.789-2.295 7.789-6.583 0-4.334-2.99-6.583-7.789-6.583h-8.53v20.838h4.265v-7.672zm0-3.616v-5.934h4.034c2.503 0 3.778 1.066 3.778 2.967 0 1.854-1.275 2.967-3.778 2.967h-4.034z"
                  ></path>
                </svg>
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  )
}
