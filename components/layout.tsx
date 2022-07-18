import Head from 'next/head';
import Image from 'next/image';
// import Link from 'next/link';

export default function Layout(params: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <>
      <style jsx global>{`
         {
          /* root element in next.js */
        }
        #__next {
          display: grid;
          width: 100vw;
          min-height: 100vh;
          grid-template-areas:
            'gapL header gapR'
            'gapL nav gapR'
            'gapL main gapR'
            'gapL footer gapR';
          grid-template-rows: var(--header-height) var(--nav-height) 1fr var(
              --footer-height
            );
          grid-template-columns:
            minmax(3vw, 1fr) minmax(var(--min-width), var(--max-width))
            minmax(3vw, 1fr);
        }
         {
          /* main sections */
        }
        header {
          grid-area: header;
          border-bottom: var(--border-width) solid var(--color-grey-dim);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          cursor: pointer;
        }
        nav {
          grid-area: nav;
          border-bottom: var(--border-width) solid var(--color-grey-dim);
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
        }
        main {
          grid-area: main;
          padding: 100px 0;
          border-bottom: var(--border-width) solid var(--color-grey-dim);
        }
        footer {
          grid-area: footer;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
         {
          /* children */
        }
        .portrait {
          margin: 0;
          border: 3px solid black;
          border-radius: 50%;
          padding: 10px;
          background-color: khaki;
        }
        h1 {
          margin: 0 0 10px 0;
          font-family: 'Roboto';
          font-weight: 100;
          font-size: 65px;
          text-align: center;
        }
        a {
          font-weight: 700;
          text-decoration: none;
          color: var(--color-grey-blue);
          padding: 10px;
          transition: all 0.15s ease-in;
        }
      `}</style>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="title" content={params.title}></meta>
        <title>{params.title}</title>
        <meta name="description" content={params.description} />
        {/* <meta
          property="og:image"
          content={`https://og-image.vercel.app/${encodeURI(
            siteTitle
          )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.zeit.co%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" /> */}
      </Head>
      <header>
        <div className="portrait">
          <Image
            priority
            src="/images/vercel.svg"
            className={''}
            height={144}
            width={144}
            alt="beaver"
          />
        </div>
        <h1>DarkMannn</h1>
      </header>
      <nav>
        <a href="">Home</a>
        <a href="">Blog</a>
      </nav>
      <main>{params.children}</main>
      <footer>
        <p>{new Date().getFullYear()} © Darko Milošević</p>
      </footer>
    </>
  );
}
