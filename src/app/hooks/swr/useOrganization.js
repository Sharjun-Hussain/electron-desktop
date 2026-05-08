import useSWR from 'swr';
import { useSession } from '@/components/auth/DesktopAuthProvider';

const fetcher = (url, accessToken) => 
  fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }).then(res => {
    if (!res.ok) {
      throw new Error('An error occurred while fetching the data.');
    }
    return res.json();
  });

export function useOrganizations() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const { 
    data: response, 
    error, 
    isLoading, 
    mutate 
  } = useSWR(
    accessToken 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations`
      : null,
    (url) => fetcher(url, accessToken) 
  );

  const organizationsArray = response ? response.data.data : [];
  
  const pagination = response ? {
    currentPage: response.data.current_page,
    lastPage: response.data.last_page,
    total: response.data.total,
    perPage: response.data.per_page,
    from: response.data.from,
    to: response.data.to,
  } : null;

  return {
    organizations: organizationsArray,
    pagination, 
    isLoading,
    isError: error,
    mutate,
  };
}