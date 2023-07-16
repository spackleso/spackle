'use client'

import { useRouter } from 'next/router'

const PostInstallBanner = () => {
  const router = useRouter()
  if (router.pathname === '/' && router.query.account_id) {
    return (
      <div className="mb-8 rounded-md bg-green-50 p-4">
        <div className="flex flex-row items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-800">
              <span className="font-semibold">Spackle</span> is now installed.
              Read the guide below to get started.
            </p>
          </div>
        </div>
      </div>
    )
  } else {
    return <></>
  }
}

export default PostInstallBanner
