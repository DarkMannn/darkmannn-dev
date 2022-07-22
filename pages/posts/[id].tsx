/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { GetStaticProps, GetStaticPaths } from 'next';

import { getAllPostIds, getPostData } from '../../lib/posts';
import Date from '../../components/date';
// import Head from 'next/head';

export default function Post({
  postData,
}: {
  postData: {
    title: string;
    date: string;
    contentHtml: string;
  };
}) {
  return (
    // <Head>
    //    <title>{postData.title}</title>
    // </Head>
    <article>
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
