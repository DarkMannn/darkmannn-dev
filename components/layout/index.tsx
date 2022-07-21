import Head from 'next/head';
import Header from './header';
import Footer from './footer';

export default function Layout(params: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <>
      <style jsx global>{`
        /* root element in next.js */
        #__next {
          display: grid;
          width: 100vw;
          min-height: 100vh;
          grid-template-areas:
            'gapL header gapR'
            'gapL main gapR'
            'gapL footer gapR';
          grid-template-rows: var(--header-height) 1fr var(--footer-height);
          grid-template-columns:
            minmax(3vw, 1fr) minmax(var(--min-width), var(--max-width))
            minmax(3vw, 1fr);
        }
        main {
          grid-area: main;
          padding: 100px 0;
          border-bottom: var(--border-width) solid var(--color-grey-dim);
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
      <Header></Header>
      <main>{params.children}</main>
      <Footer></Footer>
    </>
  );
}
