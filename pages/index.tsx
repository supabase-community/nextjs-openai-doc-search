import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { SearchDialog } from '@/components/SearchDialog'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <>
      <Head>
        <title>GoGoPool Search</title>
        <meta name="description" content="Search GoGoPool Docs with AI!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <Script
          id="__CONTEXT_BUBBLE__"
          src="https://portal.usecontext.io/portal/portal.js"
          data-theme="light"
          data-type="attribute"
        ></Script>
        <div className={styles.center}>
          <SearchDialog />
        </div>
        <div className="cursor-pointer" context-launcher="true" context-bot-id="pY3LvQEKf">
          Click to launch Context
        </div>

        <div className="py-8 w-full flex items-center justify-center space-x-6">
          <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
            <Link href="https://gogopool.com" className="flex items-center justify-center">
              <p className="text-base mr-2">Built with ♥️ by GoGoPool 🎈</p>
              <Image src={'/ggp.svg'} width="20" height="20" alt="Supabase logo" />
            </Link>
          </div>
          <div className="border-l border-gray-300 w-1 h-4" />
          <div className="flex items-center justify-center space-x-4">
            <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
              <Link
                href="https://github.com/multisig-labs/gogopool-search"
                className="flex items-center justify-center"
              >
                <Image src={'/github.svg'} width="20" height="20" alt="Github logo" />
              </Link>
            </div>
            <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
              <Link
                href="https://twitter.com/GoGoPool_"
                className="flex items-center justify-center"
              >
                <Image src={'/twitter.svg'} width="20" height="20" alt="Twitter logo" />
              </Link>
            </div>
            <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
              <Link
                href="https://github.com/supabase-community/nextjs-openai-doc-search"
                className="flex items-center justify-center"
              >
                <Image src={'/supabase.svg'} width="20" height="20" alt="Supabase Logo" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
