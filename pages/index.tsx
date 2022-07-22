import type { GetStaticProps } from 'next';

import { getAllPostDataSorted } from '../lib/posts';
import Link from 'next/link';
import Date from '../components/date';

export default function Home({
  allPostDataSorted,
}: {
  allPostDataSorted: {
    id: string;
    date: string;
    title: string;
    description: string;
  }[];
}) {
  return (
    <section>
      <h1>Blog</h1>
      <ul>
        {allPostDataSorted.map(({ id, date, title, description }) => (
          <li key={id}>
            <Link href={`/posts/${id}`}>
              <a>{title}</a>
            </Link>
            <br />
            <p>{description}</p>
            <small>
              <Date dateString={date} />
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const allPostDataSorted = getAllPostDataSorted();
  return {
    props: {
      allPostDataSorted,
    },
  };
};
