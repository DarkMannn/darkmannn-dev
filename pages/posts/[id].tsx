/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { useEffect, useRef } from 'react';
import type { GetStaticProps, GetStaticPaths } from 'next';
import { getAllPostIds, getPostData } from '../../lib/posts';
import Date from '../../components/date';
// TODO: Use this
// import Head from 'next/head';

const copyButtonClassName = 'prism-copy-button';

function _createCopyButton(copiedText: string) {
  const button = document.createElement('button');
  button.classList.add(copyButtonClassName);
  button.textContent = 'Copy';

  button.addEventListener('click', () => {
    if (button.disabled) {
      return;
    }
    navigator.clipboard.writeText(copiedText || '');
    button.disabled = true;
    setTimeout(() => {
      button.disabled = false;
    }, 200);
  });

  return button;
}

export default function Post({
  postData,
}: {
  postData: {
    title: string;
    date: string;
    contentHtml: string;
  };
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(function createAndAppendCopyButton() {
    const cleanups: (() => void)[] = [];

    const allPres = rootRef?.current?.querySelectorAll('pre');
    if (allPres?.length) {
      for (const pre of allPres) {
        const code = pre.firstElementChild;
        if (!code || !/code/i.test(code.tagName)) {
          continue;
        }
        const child = _createCopyButton(code.textContent || '');
        pre.appendChild(child);
        cleanups.push(() => {
          pre.removeChild(child);
        });
      }
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return (
    // <Head>
    //    <title>{postData.title}</title>
    // </Head>
    <article ref={rootRef}>
      <style jsx>{`
        div :global(.${copyButtonClassName}) {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 10ch;
          border-width: 0;
          border-radius: 5px;
          color: var(--color-white-mud);
          background-color: var(--color-tan-mud);
          cursor: pointer;
          transition: all 0.15s ease-out;
        }
        div :global(.${copyButtonClassName}:disabled) {
          color: var(--color-tan-mud);
          cursor: default;
        }
      `}</style>
      <h1>{postData.title}</h1>
      <div>
        <Date dateString={postData.date} />
      </div>
      <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
    </article>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const postData = await getPostData(params!.id as string);
  return {
    props: {
      postData,
    },
  };
};
