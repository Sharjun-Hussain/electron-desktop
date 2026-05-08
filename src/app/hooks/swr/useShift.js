import { useSession } from '@/components/auth/DesktopAuthProvider';
import useSWR, { useSWRConfig } from 'swr';

export function useShift() {
    const { data: session } = useSession();
    const { mutate } = useSWRConfig();

    const fetcher = (url) => fetch(url, {
        headers: {
            Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`
        }
    }).then(res => res.json());

    const activeShiftUrl = session ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/shifts/active` : null;

    // 1. Get active shift
    const useActiveShift = () => {
        return useSWR(activeShiftUrl, fetcher, {
            shouldRetryOnError: false // 404 means no active shift, don't retry endlessly
        });
    };

    // 2. Open shift
    const openShift = async (opening_cash, branch_id) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shifts/open`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
                body: JSON.stringify({ opening_cash, branch_id })
            });
            const result = await response.json();
            if (result.status === 'success') {
                mutate(activeShiftUrl);
                return { success: true, data: result.data };
            }
            throw new Error(result.message || 'Failed to open shift');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // 3. Add Transaction (Drop/Payout)
    const addTransaction = async (shiftId, type, amount, description) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shifts/${shiftId}/transactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
                body: JSON.stringify({ type, amount, description })
            });
            const result = await response.json();
            if (result.status === 'success') {
                return { success: true, data: result.data };
            }
            throw new Error(result.message || 'Failed to record transaction');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // 4. Close Shift (Z-Read)
    const closeShift = async (shiftId, closing_cash) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shifts/${shiftId}/close`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
                body: JSON.stringify({ closing_cash })
            });
            const result = await response.json();
            if (result.status === 'success') {
                mutate(activeShiftUrl); // This should now return 404 since there is no active shift
                return { success: true, data: result.data };
            }
            throw new Error(result.message || 'Failed to close shift');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    return {
        useActiveShift,
        openShift,
        addTransaction,
        closeShift
    };
}
