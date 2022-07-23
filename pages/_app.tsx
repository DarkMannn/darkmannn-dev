import type { AppProps } from 'next/app';

import 'normalize.css/normalize.css';
import '../styles/globals.css';
import '../styles/darkmannn-prism-theme.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import Layout from '../components/layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Layout title={pageProps.title} description={pageProps.description}>
      <Component {...pageProps} />
    </Layout>
  );
}
