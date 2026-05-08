import { useSettingsStore } from "@/store/useSettingsStore";

export function useCurrency() {
    const { global } = useSettingsStore();

    const formatCurrency = (amount, options = {}) => {
        if (amount === undefined || amount === null) return "";

        const currencyCode = global.currency || "LKR";
        const isCompact = options.compact || false;

        try {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currencyCode,
                notation: isCompact ? "compact" : "standard",
                compactDisplay: "short",
                maximumFractionDigits: isCompact ? 1 : 2,
                minimumFractionDigits: isCompact ? 0 : 2,
            }).format(amount);
        } catch (error) {
            return `${currencyCode} ${Number(amount).toFixed(2)}`;
        }
    };

    const formatNumber = (number, options = {}) => {
        if (number === undefined || number === null) return "";
        const isCompact = options.compact || false;

        try {
            return new Intl.NumberFormat("en-US", {
                notation: isCompact ? "compact" : "standard",
                compactDisplay: "short",
                maximumFractionDigits: isCompact ? 1 : 2,
            }).format(number);
        } catch (error) {
            return Number(number).toString();
        }
    };

    return {
        formatCurrency,
        formatNumber,
        currency: global.currency,
    };
}
