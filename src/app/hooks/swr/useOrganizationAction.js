// hooks/useOrganizationActions.js
import { useSession } from '@/components/auth/DesktopAuthProvider';
import { useSWRConfig } from 'swr';

export function useOrganizationActions() {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();

 const deleteOrganization = async (id) => {
    const organizationsKey = `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations`;
    
    try {
      // Optimistically update the UI
      mutate(organizationsKey, (currentData) => {
        if (!currentData) return currentData;
        return currentData.filter(org => org.id !== id);
      }, false); // false = don't revalidate yet

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }

      // Now revalidate to ensure we have the latest data
      mutate(organizationsKey);
      
      return { success: true };
    } catch (error) {
      // Revert optimistic update on error
      mutate(organizationsKey);
      return { success: false, error: error.message };
    }
  };


  const toggleOrganizationStatus = async (id, isActive) => {
    try {
      const endpoint = isActive ? 'deactivate' : 'activate';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${id}/${endpoint}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${isActive ? 'deactivate' : 'activate'} organization`);
      }

      // Revalidate the organizations list
      mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    deleteOrganization,
    toggleOrganizationStatus,
  };
}