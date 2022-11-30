import type { GetStaticPaths } from 'next';

const getEmptyPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export default getEmptyPaths;
