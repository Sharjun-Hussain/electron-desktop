import { useSession } from '@/components/auth/DesktopAuthProvider';
import useSWR, { useSWRConfig } from 'swr';

export function useSettings() {
    const { data: session } = useSession();
    const { mutate } = useSWRConfig();

    const fetcher = (url) => fetch(url, {
        headers: {
            Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`
        }
    }).then(res => res.json());

    // 1. Business Profile Settings
    const useBusinessSettings = () => {
        return useSWR(
            session ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/business` : null,
            fetcher
        );
    };

    const updateBusinessSettings = async (data) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/business`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.status === 'success') {
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/business`);
                return { success: true, data: result.data };
            }
            throw new Error(result.message || 'Update failed');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // 2. Modular Settings (pos, receipt, etc)
    const useModularSettings = (category) => {
        return useSWR(
            session ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/${category}` : null,
            fetcher
        );
    };

    const updateModularSettings = async (category, settings_data) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/${category}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
                body: JSON.stringify({ settings_data })
            });
            const result = await response.json();
            if (result.status === 'success') {
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/${category}`);
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/global`);
                return { success: true, data: result.data };
            }
            throw new Error(result.message || 'Update failed');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // 3. Global Settings (Business + All Modules)
    const useGlobalSettings = () => {
        return useSWR(
            session ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/global` : null,
            fetcher
        );
    };

    const uploadLogo = async (file) => {
        try {
            const formData = new FormData();
            formData.append('logo', file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/logo`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
                body: formData
            });
            const result = await response.json();
            if (result.status === 'success') {
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/business`);
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/global`);
                return { success: true, data: result.data };
            }
            throw new Error(result.message || 'Upload failed');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const testConnection = async (type, provider, config) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/test-connection`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
                body: JSON.stringify({ type, provider, config })
            });
            const result = await response.json();
            if (result.status === 'success') {
                return { success: true, message: result.message };
            }
            throw new Error(result.message || 'Verification failed');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // 4. Industrial Maintenance Methods
    const useMaintenanceStats = () => {
        return useSWR(
            session ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/maintenance/stats` : null,
            fetcher,
            { refreshInterval: 30000 } // Refresh every 30 seconds
        );
    };

    const optimizeDatabase = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/maintenance/optimize`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
            });
            const result = await response.json();
            if (result.status === 'success') {
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/maintenance/stats`);
                return { success: true, data: result.data };
            }
            throw new Error(result.message || 'Optimization failed');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const useTelemetryHistory = (minutes = 60) => {
        return useSWR(
            session ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/maintenance/telemetry?minutes=${minutes}` : null,
            fetcher,
            { refreshInterval: 60000 } // Refresh chart data every minute
        );
    };

    const purgeCache = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/maintenance/clear-cache`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
            });
            const result = await response.json();
            if (result.status === 'success') {
                return { success: true, message: result.message };
            }
            throw new Error(result.message || 'Purge failed');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const updateBackupConfig = async (data) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/backups/config`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.status === 'success') {
                mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/business`);
                return { success: true, data: result.data };
            }
            throw new Error(result.message || 'Update failed');
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const manualDownloadBackup = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/backups/download`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
                },
            });
            
            if (response.status === 403) {
                const result = await response.json();
                throw new Error(result.message || 'Permission denied');
            }

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `backup_${new Date().getTime()}.zip`;
            if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
                filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
            }
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    return {
        useBusinessSettings,
        updateBusinessSettings,
        useModularSettings,
        updateModularSettings,
        useGlobalSettings,
        uploadLogo,
        testConnection,
        useMaintenanceStats,
        optimizeDatabase,
        useTelemetryHistory,
        purgeCache,
        updateBackupConfig,
        manualDownloadBackup
    };
}
