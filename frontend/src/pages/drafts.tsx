import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import Layout from '@/components/Layout';
import Drafts from '@/components/Drafts';

export default function DraftsPage() {
  return (
    <Layout>
      <Drafts />
    </Layout>
  );
}

// Require authentication to access this page
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};